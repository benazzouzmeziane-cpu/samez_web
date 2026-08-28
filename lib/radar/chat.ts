import { z } from 'zod'
import { completeJson, isNimConfigured } from '@/lib/ai/complete-json'
import { inferBriefFromText, looksLikeSearch, normalizeBrief, type RadarBrief } from '@/lib/radar/brief'
import { isSamezCompetitor } from '@/lib/radar/filters'
import {
  createRadarConversation,
  discardRadarItems,
  getRadarConversation,
  insertRadarMessage,
  listRadarContext,
  listRadarMessages,
  titleFromRadarMessage,
  touchRadarConversation,
  type RadarMessage,
} from '@/lib/radar/store'
import { runRadarSync, type RadarSyncSummary } from '@/lib/radar/sync'
import type { SupabaseClient } from '@supabase/supabase-js'

type Piste = {
  id: string
  title: string
  subtitle?: string | null
  fit?: string | null
}

const decisionSchema = z.object({
  reply: z.string().min(1),
  search: z
    .object({
      includeCompanies: z.boolean().optional(),
      includeTenders: z.boolean().optional(),
      keywords: z.array(z.string()).optional(),
      departments: z.array(z.string()).optional(),
      naf: z.array(z.string()).optional(),
      days: z.number().optional(),
      allowEi: z.boolean().optional(),
      notes: z.string().optional(),
    })
    .nullable()
    .optional(),
  discard_ids: z.array(z.string()).optional(),
})

const SYSTEM = `Tu es l'agent radar de same'z. same'z est un DÉVELOPPEUR : il vend sites, apps et automatisations à des métiers qui n'en font pas.

ICP CLIENT (go) : immobilier, e-commerce, cabinets, artisans, resto, formation, recrutement, logistique.
CONCURRENT (nogo, à écarter) : NAF 62 / création de sites / programmation / agence web / ESN. Ils font le même métier. Ils n'ont PAS besoin de same'z.

Règles :
- Si l'utilisateur conteste une piste concurrente : tu es d'accord, tu n'insistes jamais. discard_ids = [id].
- INTERDIT : kit lancement, LinkedIn, « opportunité la plus pertinente » après un désaccord.
- search non null SEULEMENT pour une nouvelle recherche (cherche, trouve, lance).
- N'invente pas d'email, de CA, de site.

Réponds UNIQUEMENT par JSON : { "reply": string, "search": object|null, "discard_ids": string[] }.`

function mentionedPistes(text: string, pistes: Piste[]): Piste[] {
  const lower = text.toLowerCase()
  return pistes.filter(item => {
    const title = item.title.toLowerCase()
    return title.length >= 3 && lower.includes(title)
  })
}

function looksLikeObjection(text: string): boolean {
  return /pourquoi|pas besoin|concurrent|m[eê]me chose|c['’ ]est lui|n['’]a pas besoin|ne va(s)? pas|il fait|il cr[ée]e|tu comprends pas|d[eé]bile|confr[eè]re|m[eê]me m[eé]tier/.test(
    text.toLowerCase()
  )
}

function isCompetitorPiste(item: Piste): boolean {
  return isSamezCompetitor({ title: item.title, activity: item.subtitle })
}

function competitorReply(discarded: Piste[], remaining: Piste[]): string {
  const names = discarded.map(item => item.title)
  const better = remaining.filter(item => !isCompetitorPiste(item)).slice(0, 2)
  const head = names.length
    ? `Oui. ${names.join(', ')} ${names.length > 1 ? 'sont des concurrents' : 'est un concurrent'} : même métier (sites / logiciels). Ce n’est pas un client same’z. Piste écartée.`
    : 'Oui : une agence ou un éditeur qui crée des sites n’est pas un client same’z. J’écarte ce type de piste.'
  const next = better.length
    ? ` Cibles plus saines dans la liste : ${better.map(item => item.title).join(', ')}.`
    : ' On cible des métiers qui ACHÈTENT du logiciel (immo, e-commerce, cabinets, artisans), pas ceux qui en vendent.'
  return `${head}${next}`
}

export async function chatRadar(supabase: SupabaseClient, message: string, conversationId?: string | null) {
  const text = message.trim().slice(0, 2000)
  if (!text) throw new Error('Message vide')

  let conversation = conversationId ? await getRadarConversation(supabase, conversationId) : null
  if (!conversation) {
    conversation = await createRadarConversation(supabase, text)
  } else if (conversation.title === 'Nouveau chat') {
    await touchRadarConversation(supabase, conversation.id, text)
    conversation = { ...conversation, title: titleFromRadarMessage(text) }
  } else {
    await touchRadarConversation(supabase, conversation.id)
  }

  await insertRadarMessage(supabase, conversation.id, 'user', text)

  const [history, pistes] = await Promise.all([
    listRadarMessages(supabase, conversation.id, 24).catch(() => [] as RadarMessage[]),
    listRadarContext(supabase, 20).catch(() => []),
  ])
  const list = pistes as Piste[]

  const objection = looksLikeObjection(text)
  const namedNow = mentionedPistes(text, list)
  const namedHistory = mentionedPistes(history.map(item => item.content).join('\n'), list)
  const named = namedNow.length ? namedNow : namedHistory.filter(isCompetitorPiste)
  const competitorNamed = named.filter(isCompetitorPiste)
  const goCompetitors = list.filter(item => isCompetitorPiste(item) && item.fit === 'go')

  let decision = {
    reply: '',
    search: null as RadarBrief | null,
    discardIds: [] as string[],
  }

  if (objection) {
    const targets = competitorNamed.length ? competitorNamed : namedNow.length ? [] : goCompetitors
    decision.discardIds = [...new Set(targets.map(item => item.id))]
  }

  const skipModel = objection && decision.discardIds.length > 0
  if (skipModel) {
    const discarded = list.filter(item => decision.discardIds.includes(item.id))
    decision.reply = competitorReply(discarded, list)
    decision.search = null
  } else if (isNimConfigured()) {
    try {
      const raw = await completeJson(
        SYSTEM,
        JSON.stringify({
          message: text,
          objection,
          historique: history.slice(-8).map(item => ({ role: item.role, content: item.content.slice(0, 400) })),
          pistes: list.map(item => ({
            id: item.id,
            titre: item.title,
            activite: item.subtitle,
            fit: item.fit,
            concurrent: isCompetitorPiste(item),
          })),
        }),
        { maxTokens: 900, temperature: 0.2 }
      )
      const parsed = decisionSchema.safeParse(raw)
      if (parsed.success) {
        decision.reply = parsed.data.reply
        if (!objection && parsed.data.search) {
          decision.search = normalizeBrief({
            ...parsed.data.search,
            query: text,
            notes: parsed.data.search.notes || text,
          })
        }
        if (parsed.data.discard_ids?.length) {
          const allowed = new Set(list.map(item => item.id))
          decision.discardIds = [
            ...new Set([...decision.discardIds, ...parsed.data.discard_ids.filter(id => allowed.has(id))]),
          ]
        }
      }
    } catch (error) {
      console.error('[radar-chat] IA', error)
    }
  }

  if (decision.discardIds.length) {
    const discarded = list.filter(item => decision.discardIds.includes(item.id))
    await discardRadarItems(
      supabase,
      decision.discardIds,
      'Écarté : concurrent / même métier que same’z'
    ).catch(error => console.error('[radar-chat] discard', error))
    if (!decision.reply || /kit lancement|la plus pertinente|contacter sur LinkedIn/i.test(decision.reply)) {
      decision.reply = competitorReply(discarded, list)
    }
    decision.search = null
  }

  if (!decision.search && !objection && looksLikeSearch(text)) {
    decision.search = inferBriefFromText(text)
  }
  if (!decision.reply) {
    decision.reply = decision.search
      ? `Je lance une recherche : ${decision.search.keywords.join(', ') || text}${decision.search.departments.length ? ` · dept ${decision.search.departments.join(', ')}` : ''}.`
      : 'Je n’ai pas pu interpréter la demande. Précisez une cible (ex. « agences immo Paris ») ou une question sur une piste.'
  }

  let summary: RadarSyncSummary | null = null
  if (decision.search) {
    try {
      summary = await runRadarSync(supabase, { brief: decision.search, digest: false })
      const extra = `\n\nRecherche terminée : ${summary.fetched} lus, ${summary.kept} retenus (${summary.companiesKept} entreprises, ${summary.tendersKept} marchés), ${summary.scored} scorés.`
      if (!decision.reply.includes('Recherche terminée')) decision.reply = `${decision.reply}${extra}`
    } catch (error) {
      const fail = error instanceof Error ? error.message : 'Recherche impossible'
      decision.reply = `${decision.reply}\n\nLa recherche a échoué : ${fail}`
    }
  }

  await insertRadarMessage(supabase, conversation.id, 'assistant', decision.reply, decision.search)
  return {
    reply: decision.reply,
    conversationId: conversation.id,
    title: conversation.title,
    searched: Boolean(decision.search),
    discarded: decision.discardIds.length,
    summary,
  }
}
