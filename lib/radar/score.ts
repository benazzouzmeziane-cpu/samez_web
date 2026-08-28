import { ACTIVITY_DROP, ACTIVITY_KEEP, isAllowedCompanyForm, isSamezCompetitor, nafWeight } from '@/lib/radar/filters'
import type { RadarBrief } from '@/lib/radar/brief'
import type { EnrichedCompany, RadarScore, TenderDraft } from '@/lib/radar/types'

const ENTERPRISE_TENDER =
  /\b(sap|oracle|microsoft 365|active directory|infogérance nationale|accord-cadre national|lots?\s+\d+\s+à\s+\d+)\b/i
const SOLO_FIT_TENDER =
  /\b(site (web|internet)|vitrine|application métier|workflow|automatisation|agent ia|chatbot|espace client|prise de (rdv|rendez-vous)|crm|devis|facturation)\b/i

export function cheapCompanyKeep(activity: string | null, legalFormLabel: string | null, title?: string | null): boolean {
  const text = `${title ?? ''} ${activity ?? ''} ${legalFormLabel ?? ''}`
  if (ACTIVITY_DROP.test(text)) return false
  if (isSamezCompetitor({ activity, title })) return true
  if (legalFormLabel && /sci|entrepreneur individuel|^ei\b/i.test(legalFormLabel)) return false
  return ACTIVITY_KEEP.test(text) || /sas|sarl|eurl/i.test(legalFormLabel ?? '')
}

export function matchesDraft(
  draft: { title: string; activity: string | null; city: string | null; department: string | null; legalFormLabel: string | null },
  brief: RadarBrief
): boolean {
  if (brief.departments.length && draft.department && !brief.departments.includes(draft.department)) return false
  if (!brief.keywords.length) return cheapCompanyKeep(draft.activity, draft.legalFormLabel, draft.title)
  const hay = `${draft.title} ${draft.activity ?? ''} ${draft.city ?? ''}`.toLowerCase()
  return brief.keywords.some(keyword => hay.includes(keyword))
}

export function matchesBrief(company: EnrichedCompany, brief: RadarBrief): boolean {
  if (brief.departments.length && company.department && !brief.departments.includes(company.department)) {
    return false
  }
  if (brief.naf.length && company.naf && !brief.naf.some(code => company.naf?.startsWith(code.replace(/\.$/, '')))) {
    return false
  }
  if (!brief.keywords.length) return cheapCompanyKeep(company.activity, company.legalForm)
  const hay = `${company.title} ${company.activity ?? ''} ${company.naf ?? ''} ${company.legalForm ?? ''}`.toLowerCase()
  return brief.keywords.some(keyword => hay.includes(keyword))
}

export function scoreCompanyDeterministic(company: EnrichedCompany): RadarScore {
  const reasons: string[] = []
  let pre = 8

  if (company.kind === 'cession') {
    pre += 18
    reasons.push('Cession / reprise : besoin d’outils neuf fréquent')
  } else if (!isSamezCompetitor(company)) {
    pre += 10
    reasons.push('Création récente : fenêtre kit lancement')
  }

  if (isAllowedCompanyForm(company.natureJuridique)) {
    pre += 18
    reasons.push(`Forme ${company.legalForm || company.natureJuridique}`)
  } else if (company.natureJuridique) {
    pre -= 25
    reasons.push('Forme juridique peu acheteuse (EI / SCI / autre)')
  } else if (company.legalForm && /sas|sarl|eurl/i.test(company.legalForm)) {
    pre += 12
    reasons.push(`Forme déclarée BODACC : ${company.legalForm}`)
  }

  if (isSamezCompetitor(company)) {
    pre = Math.min(pre, 18)
    reasons.push('Concurrent : même métier que same’z (dev / sites / logiciels). Pas un client.')
  } else {
    const naf = nafWeight(company.naf)
    if (naf > 0) {
      pre += naf
      reasons.push(`NAF ${company.naf} : métier acheteur de process`)
    } else if (company.activity && ACTIVITY_KEEP.test(company.activity)) {
      pre += 14
      reasons.push('Activité BODACC dans le périmètre same’z')
    } else {
      pre -= 8
    }
  }

  if (company.employer) {
    pre += 8
    reasons.push('Caractère employeur : process à outiller')
  }
  if (company.contactName) {
    pre += 4
    reasons.push(`Dirigeant identifiable : ${company.contactName}`)
  }
  if (company.activity && ACTIVITY_DROP.test(company.activity)) {
    pre = Math.min(pre, 20)
    reasons.push('Activité hors cible')
  }

  pre = clamp(pre)
  const competitor = isSamezCompetitor(company)
  const fit = competitor ? 'nogo' : pre >= 62 ? 'go' : pre >= 40 ? 'possible' : 'nogo'
  const offer = competitor
    ? 'skip'
    : company.kind === 'cession'
      ? 'app_metier'
      : company.naf?.startsWith('69.20')
        ? 'partenariat'
        : 'kit_lancement'

  return {
    preScore: pre,
    score: pre,
    fit,
    offer: fit === 'nogo' ? 'skip' : offer,
    reasons: reasons.slice(0, 4),
    nextAction: competitor
      ? 'Écarter — concurrent, pas un acheteur'
      : fit === 'nogo'
        ? 'Écarter — hors cible'
        : `Trouver le dirigeant${company.contactName ? ` (${company.contactName})` : ''} sur LinkedIn, ne pas spammer un email inventé`,
    approachSubject: '',
    approachBody: '',
  }
}

export function scoreTenderDeterministic(tender: TenderDraft): RadarScore {
  const text = `${tender.title} ${JSON.stringify(tender.payload)}`
  const reasons: string[] = []
  let pre = 12

  if (SOLO_FIT_TENDER.test(text)) {
    pre += 28
    reasons.push('Objet compatible freelance (site, app, workflow, IA)')
  }
  if (ENTERPRISE_TENDER.test(text)) {
    pre -= 30
    reasons.push('Profil grand compte / progiciel lourd — risque no-go')
  }
  if (tender.deadlineAt) {
    const days = Math.round((new Date(tender.deadlineAt).getTime() - Date.now()) / 86_400_000)
    if (days < 12) {
      pre -= 20
      reasons.push(`Deadline trop courte (${days} j)`)
    } else {
      pre += 10
      reasons.push(`${days} jours pour répondre`)
    }
  }
  if (tender.buyer) {
    pre += 6
    reasons.push(`Acheteur : ${tender.buyer}`)
  }

  pre = clamp(pre)
  const fit = pre >= 58 ? 'go' : pre >= 38 ? 'possible' : 'nogo'

  return {
    preScore: pre,
    score: pre,
    fit,
    offer: fit === 'nogo' ? 'skip' : 'marche',
    reasons: reasons.slice(0, 4),
    nextAction:
      fit === 'nogo'
        ? 'Écarter — hors capacité solo'
        : 'Lire l’avis, extraire lots possibles, décider go/no-go avant d’écrire',
    approachSubject: '',
    approachBody: '',
  }
}

export function shouldKeepCompany(company: EnrichedCompany, score: RadarScore, brief?: RadarBrief): boolean {
  if (isSamezCompetitor(company) && !brief?.notes?.toLowerCase().includes('partenaire')) {
    return true
  }
  if (brief?.keywords.length) {
    if (ACTIVITY_DROP.test(`${company.activity ?? ''} ${company.title}`)) return false
    if (!brief.allowEi && company.natureJuridique && !isAllowedCompanyForm(company.natureJuridique) && score.preScore < 28) {
      return false
    }
    return score.preScore >= 22
  }
  if (score.fit === 'nogo' && score.preScore < 32) return false
  if (!isAllowedCompanyForm(company.natureJuridique) && score.preScore < 42) return false
  return score.preScore >= 36
}

export function shouldKeepTender(score: RadarScore): boolean {
  return score.preScore >= 34
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
