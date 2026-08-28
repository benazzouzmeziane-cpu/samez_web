import { ACTIVITY_DROP, ACTIVITY_KEEP, isAllowedCompanyForm, nafWeight } from '@/lib/radar/filters'
import type { EnrichedCompany, RadarScore, TenderDraft } from '@/lib/radar/types'

const ENTERPRISE_TENDER =
  /\b(sap|oracle|microsoft 365|active directory|infogérance nationale|accord-cadre national|lots?\s+\d+\s+à\s+\d+)\b/i
const SOLO_FIT_TENDER =
  /\b(site (web|internet)|vitrine|application métier|workflow|automatisation|agent ia|chatbot|espace client|prise de (rdv|rendez-vous)|crm|devis|facturation)\b/i

export function cheapCompanyKeep(activity: string | null, legalFormLabel: string | null): boolean {
  const text = `${activity ?? ''} ${legalFormLabel ?? ''}`
  if (ACTIVITY_DROP.test(text)) return false
  if (legalFormLabel && /sci|entrepreneur individuel|^ei\b/i.test(legalFormLabel)) return false
  return ACTIVITY_KEEP.test(text) || /sas|sarl|eurl/i.test(legalFormLabel ?? '')
}

export function scoreCompanyDeterministic(company: EnrichedCompany): RadarScore {
  const reasons: string[] = []
  let pre = 8

  if (company.kind === 'cession') {
    pre += 18
    reasons.push('Cession / reprise : besoin d’outils neuf fréquent')
  } else {
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

  const naf = nafWeight(company.naf)
  if (naf > 0) {
    pre += naf
    reasons.push(`NAF ${company.naf} aligné TPE/PME process`)
  } else if (company.activity && ACTIVITY_KEEP.test(company.activity)) {
    pre += 14
    reasons.push('Activité BODACC dans le périmètre same’z')
  } else {
    pre -= 8
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
  const fit = pre >= 62 ? 'go' : pre >= 40 ? 'possible' : 'nogo'
  const offer =
    company.kind === 'cession'
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
    nextAction:
      fit === 'nogo'
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

export function shouldKeepCompany(company: EnrichedCompany, score: RadarScore): boolean {
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
