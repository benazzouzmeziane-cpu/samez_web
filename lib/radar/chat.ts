import { z } from 'zod'
import { completeJson, isNimConfigured } from '@/lib/ai/complete-json'
import { memoryContext, proposeAgentMemory } from '@/lib/agents/store'
import {
  briefsEqual,
  inferBriefFromConversation,
  normalizeBrief,
  wantsSearch,
  type RadarBrief,
} from '@/lib/radar/brief'
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
  score?: number | null
}

const replySchema = z.object({
  reply: z.string().min(1),
  discard_ids: z.array(z.string()).optional(),
})

const SYSTEM = `Tu es l'agent radar de same'z. Tu parles à Meziane, développeur freelance. Tu es un collègue, pas un formulaire.

same'z vend sites, apps et automatisations à des métiers qui n'en font PAS (fleuristes, immo, restos, artisans, cabinets…). NAF 62 / agence web = concurrent, à écarter.

Règles :
- Réponds au DERNIER message, en tenant compte de tout le fil.
- Interdit de recoller une réponse déjà donnée.
- Interdit de dire « trop vague » ou « précisez le secteur » si un métier, un lieu ou un type (marché / création) est déjà nommé.
- N'invente pas d'email, de CA, de site.
- 4 à 8 phrases, français, concret.
- Si une recherche vient d'être lancée, commente les vrais chiffres et cite 1 à 3 pistes par leur nom. Si 0 retenu, propose UNE prochaine recherche précise.

Réponds UNIQUEMENT par JSON : { "reply": string, "discard_ids": string[] }.`

function mentionedPistes(text: string, pistes: Piste[]): Piste[] {
  const lower = text.toLowerCase()
  return pistes.filter(item => {
    const title = item.title.toLowerCase()
    return title.length >= 3 && lower.includes(title)
  })
}

function looksLikeObjection(text: string): boolean {
  return /concurrent|m[eê]me chose|m[eê]me m[eé]tier|c['’ ]est lui qui|n['’]a pas besoin de moi|il cr[ée]e (lui-?m[eê]me )?(des )?sites?|confr[eè]re|agence web/.test(
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
    : ' On cible des métiers qui ACHÈTENT du logiciel (immo, e-commerce, cabinets, artisans, fleuristes), pas ceux qui en vendent.'
  return `${head}${next}`
}

function tooSimilar(a: string, b: string) {
  const left = a.replace(/\s+/g, ' ').slice(0, 160).toLowerCase()
  const right = b.replace(/\s+/g, ' ').slice(0, 160).toLowerCase()
  return Boolean(left && right && (left === right || left.slice(0, 80) === right.slice(0, 80)))
}

function cannedOrVague(reply: string, brief: RadarBrief | null) {
  if (/trop vague|précisez le secteur|precisiez le secteur|kit lancement|la plus pertinente|contacter sur LinkedIn/i.test(reply)) {
    return Boolean(brief?.keywords.length || brief?.departments.length)
  }
  return false
}

function parseStoredBrief(value: unknown): RadarBrief | null {
  if (!value || typeof value !== 'object') return null
  return normalizeBrief(value as Partial<RadarBrief>)
}

function fallbackReply(brief: RadarBrief | null, summary: RadarSyncSummary | null, pistes: Piste[], skippedDuplicate: boolean) {
  if (!brief) {
    return 'Je n’ai pas assez pour chercher. Donnez un métier (ex. fleuriste, immo) et un lieu, ou un type : créations d’entreprises ou marchés publics.'
  }
  const cible = brief.keywords.join(', ') || brief.query
  const where = brief.departments.length ? ` · dép. ${brief.departments.join(', ')}` : ''
  const kind = brief.includeTenders && !brief.includeCompanies ? 'marchés publics' : 'créations / entreprises'
  if (skippedDuplicate) {
    const names = pistes.filter(item => !isCompetitorPiste(item)).slice(0, 3).map(item => item.title)
    return names.length
      ? `On a déjà cette recherche (${kind} « ${cible} »${where}). Pistes à voir : ${names.join(', ')}. Affine (autre métier, autre département) ou dis-moi laquelle on discute.`
      : `On a déjà cherché ${kind} « ${cible} »${where}, sans piste exploitable. On peut élargir la zone ou changer de métier.`
  }
  if (!summary) {
    return `Cible : ${kind} « ${cible} »${where}. Je lance.`
  }
  if (summary.kept === 0) {
    return `J’ai cherché ${kind} « ${cible} »${where} : ${summary.fetched} lus, 0 assez proches. Prochaine étape possible : France entière, ou un métier voisin (pas un concurrent NAF 62).`
  }
  const names = pistes.filter(item => !isCompetitorPiste(item)).slice(0, 3).map(item => item.title)
  return `Recherche ${kind} « ${cible} »${where} : ${summary.kept} pistes (${summary.companiesKept} entreprises, ${summary.tendersKept} marchés). ${names.length ? `À regarder : ${names.join(', ')}.` : ''} Dis-moi laquelle on qualifie, ou affine.`
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

  const [history, pistes, memories] = await Promise.all([
    listRadarMessages(supabase, conversation.id, 24).catch(() => [] as RadarMessage[]),
    listRadarContext(supabase, 20).catch(() => []),
    memoryContext(supabase, 'radar').catch(() => []),
  ])
  let list = pistes as Piste[]
  const userTurns = history.filter(item => item.role === 'user').map(item => item.content)
  const thread = userTurns.join('\n')
  const lastAssistant = [...history].reverse().find(item => item.role === 'assistant')

  const objection = looksLikeObjection(text)
  const namedNow = mentionedPistes(text, list)
  const namedHistory = mentionedPistes(thread, list)
  const named = namedNow.length ? namedNow : namedHistory.filter(isCompetitorPiste)
  const competitorNamed = named.filter(isCompetitorPiste)
  const goCompetitors = list.filter(item => isCompetitorPiste(item) && item.fit === 'go')

  const discardIds = objection
    ? [...new Set((competitorNamed.length ? competitorNamed : namedNow.length ? [] : goCompetitors).map(item => item.id))]
    : []

  let reply = ''
  let search: RadarBrief | null = null
  let skippedDuplicate = false
  let summary: RadarSyncSummary | null = null
  let intent: RadarBrief | null = null

  if (objection && discardIds.length) {
    const discarded = list.filter(item => discardIds.includes(item.id))
    await discardRadarItems(supabase, discardIds, 'Écarté : concurrent / même métier que same’z').catch(error =>
      console.error('[radar-chat] discard', error)
    )
    for (const item of discarded) {
      await proposeAgentMemory(supabase, {
        domain: 'radar',
        kind: 'experience',
        key: `radar.rejected.${item.id}`,
        title: `Piste concurrente écartée : ${item.title}`,
        content: `${item.title} a été écartée après correction humaine : même métier que same’z.`,
        payload: { itemId: item.id, title: item.title, activity: item.subtitle },
        sourceAgent: 'radar-agent',
        sourceRefType: 'radar_item',
        sourceRefId: item.id,
        confidence: 1,
        tags: ['radar', 'correction-humaine', 'concurrent'],
        expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
      }).catch(error => console.error('[radar-chat] learn', error))
    }
    reply = competitorReply(discarded, list)
  } else {
    const brief = inferBriefFromConversation(userTurns)
    intent = brief
    const lastBrief = parseStoredBrief(lastAssistant?.brief)
    if (wantsSearch(text, thread) && (brief.keywords.length || brief.departments.length)) {
      if (lastBrief && briefsEqual(brief, lastBrief)) skippedDuplicate = true
      else search = brief
    }

    if (search) {
      try {
        summary = await runRadarSync(supabase, { brief: search, digest: false })
        list = ((await listRadarContext(supabase, 20).catch(() => [])) as Piste[]) ?? list
      } catch (error) {
        const fail = error instanceof Error ? error.message : 'Recherche impossible'
        reply = `La recherche a échoué : ${fail}. On peut réessayer plus simple (un métier + un département).`
      }
    }

    if (!reply) {
      reply = fallbackReply(search || brief, summary, list, skippedDuplicate)
      if (isNimConfigured()) {
        try {
          const raw = await completeJson(
            SYSTEM,
            JSON.stringify({
              dernierMessage: text,
              cible: search || brief,
              memoiresValidees: memories,
              rechercheLancee: Boolean(search),
              dejaFaite: skippedDuplicate,
              resultats: summary,
              pistes: list.slice(0, 12).map(item => ({
                id: item.id,
                titre: item.title,
                activite: item.subtitle,
                fit: item.fit,
                score: item.score,
                concurrent: isCompetitorPiste(item),
              })),
            }),
            {
              maxTokens: 700,
              temperature: 0.45,
              history: history.slice(0, -1).slice(-8).map(item => ({
                role: item.role,
                content:
                  item.role === 'assistant'
                    ? item.content.split('Recherche terminée')[0].trim().slice(0, 360)
                    : item.content.slice(0, 400),
              })),
            }
          )
          const parsed = replySchema.safeParse(raw)
          if (parsed.success && !tooSimilar(parsed.data.reply, lastAssistant?.content || '') && !cannedOrVague(parsed.data.reply, search || brief)) {
            reply = parsed.data.reply
            if (parsed.data.discard_ids?.length) {
              const allowed = new Set(list.map(item => item.id))
              const extra = parsed.data.discard_ids.filter(id => allowed.has(id))
              if (extra.length) {
                await discardRadarItems(supabase, extra, 'Écarté : concurrent / même métier que same’z').catch(error =>
                  console.error('[radar-chat] discard', error)
                )
              }
            }
          }
        } catch (error) {
          console.error('[radar-chat] IA', error)
        }
      }
    }
  }

  await insertRadarMessage(
    supabase,
    conversation.id,
    'assistant',
    reply,
    search ?? (skippedDuplicate ? intent : null)
  )
  return {
    reply,
    conversationId: conversation.id,
    title: conversation.title,
    searched: Boolean(search),
    discarded: discardIds.length,
    summary,
  }
}
