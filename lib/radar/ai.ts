import { z } from 'zod'
import { completeJson, isNimConfigured } from '@/lib/ai/complete-json'
import type { EnrichedCompany, RadarScore, TenderDraft } from '@/lib/radar/types'

const aiScoreSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  fit: z.enum(['go', 'possible', 'nogo']),
  offer: z.enum(['kit_lancement', 'automation', 'app_metier', 'partenariat', 'marche', 'skip']),
  reasons: z.array(z.string()).optional().transform(value => (value ?? []).slice(0, 4)),
  next_action: z.string().optional().transform(value => (value ?? '').slice(0, 240)),
  approach_subject: z.string().optional().transform(value => (value ?? '').slice(0, 90)),
  approach_body: z.string().optional().transform(value => (value ?? '').slice(0, 900)),
})

const COMPANY_SYSTEM = `Tu qualifies des prospects pour same'z, développeur indépendant français.
same'z vend : sites, apps métiers, automatisations et agents IA pour TPE/PME. Ticket typique : quelques milliers à quelques dizaines de milliers d'euros. Pas d'équipe, pas d'infogérance SAP/Oracle.
Réponds UNIQUEMENT par un JSON compact.
Règles :
- N'invente jamais email, téléphone, CA, effectif, site web.
- nogo si SCI, micro, holding vide, coiffeur/tabac, ou besoin grand compte.
- go seulement si un freelance peut vendre un kit lancement, une app, une automatisation ou un partenariat cabinet.
- approach_body : vouvoiement, 6-8 lignes, ancré dans L'ACTIVITÉ fournie, CTA https://samez.fr/reserver. Interdit : "j'ai visité votre site" si aucun site n'est fourni.
- next_action : une action humaine concrète (LinkedIn, BODACC, appeler le greffe, etc.).`

const TENDER_SYSTEM = `Tu es le filtre go/no-go marchés publics de same'z (freelance solo).
Réponds UNIQUEMENT par un JSON compact.
go seulement si un indépendant peut répondre (site, app métier, petit SI, automatisation, agent, maintenance logicielle ciblée).
nogo si SAP/Oracle, accord-cadre national, lots énormes, BTP lourd, défense classifiée, infogérance 24/7.
offer=marche si go/possible, skip si nogo.
approach_body : plan de réponse en 6 lignes (lots, questions, délai), pas un email à l'acheteur.
N'invente aucun budget.`

export async function refineCompanyScore(
  company: EnrichedCompany,
  baseline: RadarScore
): Promise<RadarScore> {
  if (!isNimConfigured()) return baseline
  const raw = await completeJson(
      COMPANY_SYSTEM,
      JSON.stringify({
        baseline,
        cible: {
          nom: company.title,
          siren: company.siren,
          kind: company.kind,
          forme: company.legalForm,
          naf: company.naf,
          activite: company.activity,
          ville: company.city,
          dirigeant: company.contactName,
          employeur: company.employer,
        },
      })
    )
  const parsed = aiScoreSchema.safeParse(raw)
  if (!parsed.success) return baseline
  return mergeAi(baseline, parsed.data)
}

export async function refineTenderScore(tender: TenderDraft, baseline: RadarScore): Promise<RadarScore> {
  if (!isNimConfigured()) return baseline
  const raw = await completeJson(
      TENDER_SYSTEM,
      JSON.stringify({
        baseline,
        avis: {
          objet: tender.title,
          acheteur: tender.buyer,
          deadline: tender.deadlineAt,
          departement: tender.department,
          extra: tender.payload,
        },
      })
    )
  const parsed = aiScoreSchema.safeParse(raw)
  if (!parsed.success) return baseline
  return mergeAi(baseline, parsed.data)
}

function mergeAi(baseline: RadarScore, parsed: z.infer<typeof aiScoreSchema>): RadarScore {
  const score = Math.round(baseline.preScore * 0.35 + parsed.score * 0.65)
  return {
    preScore: baseline.preScore,
    score: Math.max(0, Math.min(100, score)),
    fit: parsed.fit,
    offer: parsed.offer,
    reasons: (parsed.reasons.length ? parsed.reasons : baseline.reasons).slice(0, 4),
    nextAction: parsed.next_action || baseline.nextAction,
    approachSubject: parsed.approach_subject || baseline.approachSubject,
    approachBody: parsed.approach_body || baseline.approachBody,
  }
}
