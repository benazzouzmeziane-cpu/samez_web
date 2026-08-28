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

const COMPANY_SYSTEM = `Tu qualifies des prospects CLIENTS pour same'z, développeur indépendant français.
same'z VEND des sites, apps et automatisations à des TPE/PME qui ne sont PAS des agences web / ESN / indépendants du logiciel.
Clients typiques : immobilier, e-commerce, cabinets, artisans, resto, formation, recrutement.
CONCURRENTS (nogo, offer=skip) : NAF 62.xx / 63.1x, programmation, création de sites, agence web, ESN. Ils font le même métier : ils n'achètent pas same'z.
Réponds UNIQUEMENT par un JSON compact.
Règles :
- N'invente jamais email, téléphone, CA, effectif, site web.
- nogo si concurrent, SCI, micro, holding vide, ou besoin grand compte.
- go seulement si le métier ACHÈTE du logiciel (pas s'il en vend).
- approach_body vide si nogo.
- Si consigneUtilisateur est fournie, elle prime (sans inventer de faits).
- next_action : une action humaine concrète.`

const TENDER_SYSTEM = `Tu es le filtre go/no-go marchés publics de same'z (freelance solo).
Réponds UNIQUEMENT par un JSON compact.
go seulement si un indépendant peut répondre (site, app métier, petit SI, automatisation, agent, maintenance logicielle ciblée).
nogo si SAP/Oracle, accord-cadre national, lots énormes, BTP lourd, défense classifiée, infogérance 24/7.
offer=marche si go/possible, skip si nogo.
approach_body : plan de réponse en 6 lignes (lots, questions, délai), pas un email à l'acheteur.
N'invente aucun budget.`

export async function refineCompanyScore(
  company: EnrichedCompany,
  baseline: RadarScore,
  instruction?: string
): Promise<RadarScore> {
  if (!isNimConfigured()) return baseline
  const raw = await completeJson(
      COMPANY_SYSTEM,
      JSON.stringify({
        consigneUtilisateur: instruction || null,
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

export async function refineTenderScore(
  tender: TenderDraft,
  baseline: RadarScore,
  instruction?: string
): Promise<RadarScore> {
  if (!isNimConfigured()) return baseline
  const raw = await completeJson(
      TENDER_SYSTEM,
      JSON.stringify({
        consigneUtilisateur: instruction || null,
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
  if (baseline.fit === 'nogo' && /concurrent/i.test(baseline.reasons.join(' '))) {
    return { ...baseline, approachBody: '', approachSubject: '' }
  }
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
