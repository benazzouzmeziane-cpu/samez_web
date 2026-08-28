import { z } from 'zod'
import { completeJson, isNimConfigured } from '@/lib/ai/complete-json'
import { inferBriefFromText, looksLikeSearch, normalizeBrief, type RadarBrief } from '@/lib/radar/brief'
import { insertRadarMessage, listRadarContext, listRadarMessages, type RadarMessage } from '@/lib/radar/store'
import { runRadarSync, type RadarSyncSummary } from '@/lib/radar/sync'
import type { SupabaseClient } from '@supabase/supabase-js'

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
})

const SYSTEM = `Tu es l'agent radar commercial de same'z, développeur indépendant.
Tu aides à chercher des entreprises (Sirene / BODACC) et des marchés publics (BOAMP), puis tu discutes des pistes déjà trouvées.
Réponds UNIQUEMENT par un JSON : { "reply": string, "search": object|null }.
- search non null UNIQUEMENT si l'utilisateur demande une nouvelle recherche (cherche, trouve, lance, cible, élargis, marchés, créations…).
- search.keywords : mots-clés d'activité, sans apostrophe.
- search.departments : codes INSEE 2 chiffres (75, 69…).
- search.includeCompanies / includeTenders selon la demande.
- Si la question porte sur les pistes déjà listées : search=null, reply = analyse concrète (qui contacter, pourquoi, angle). N'invente pas d'email, de CA ni de site.
- reply en français, vouvoiement, 4 à 12 phrases utiles.`

export async function chatRadar(supabase: SupabaseClient, message: string) {
  const text = message.trim().slice(0, 2000)
  if (!text) throw new Error('Message vide')

  await insertRadarMessage(supabase, 'user', text)

  const [history, pistes] = await Promise.all([
    listRadarMessages(supabase, 24).catch(() => [] as RadarMessage[]),
    listRadarContext(supabase, 15).catch(() => []),
  ])

  let decision = {
    reply: '',
    search: null as RadarBrief | null,
  }

  if (isNimConfigured()) {
    try {
      const raw = await completeJson(
        SYSTEM,
        JSON.stringify({
          message: text,
          historique: history.slice(-10).map(item => ({ role: item.role, content: item.content.slice(0, 500) })),
          pistes,
        }),
        { maxTokens: 1100 }
      )
      const parsed = decisionSchema.safeParse(raw)
      if (parsed.success) {
        decision.reply = parsed.data.reply
        if (parsed.data.search) {
          decision.search = normalizeBrief({ ...parsed.data.search, query: text, notes: parsed.data.search.notes || text })
        }
      }
    } catch (error) {
      console.error('[radar-chat] IA', error)
    }
  }

  if (!decision.search && looksLikeSearch(text)) {
    decision.search = inferBriefFromText(text)
  }
  if (!decision.reply) {
    decision.reply = decision.search
      ? `Je lance une recherche : ${decision.search.keywords.join(', ') || text}${decision.search.departments.length ? ` · dept ${decision.search.departments.join(', ')}` : ''}.`
      : 'Je n’ai pas pu interpréter la demande. Précisez une cible (ex. « agences immo Paris, SAS ») ou une question sur une piste.'
  }

  let summary: RadarSyncSummary | null = null
  if (decision.search) {
    try {
      summary = await runRadarSync(supabase, { brief: decision.search, digest: false })
      const extra = `\n\nRecherche terminée : ${summary.fetched} lus, ${summary.kept} retenus (${summary.companiesKept} entreprises, ${summary.tendersKept} marchés), ${summary.scored} scorés. Relisez la liste — on peut affiner.`
      if (!decision.reply.includes('Recherche terminée')) decision.reply = `${decision.reply}${extra}`
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Recherche impossible'
      decision.reply = `${decision.reply}\n\nLa recherche a échoué : ${message}`
    }
  }

  await insertRadarMessage(supabase, 'assistant', decision.reply, decision.search)
  return { reply: decision.reply, searched: Boolean(decision.search), summary }
}
