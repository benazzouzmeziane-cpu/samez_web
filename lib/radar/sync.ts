import type { SupabaseClient } from '@supabase/supabase-js'
import { refineCompanyScore, refineTenderScore } from '@/lib/radar/ai'
import { fetchRecentCompanies } from '@/lib/radar/bodacc'
import { fetchItTenders } from '@/lib/radar/boamp'
import {
  cheapCompanyKeep,
  scoreCompanyDeterministic,
  scoreTenderDeterministic,
  shouldKeepCompany,
  shouldKeepTender,
} from '@/lib/radar/score'
import { enrichCompanies } from '@/lib/radar/sirene'
import {
  finishRadarRun,
  listUnscored,
  startRadarRun,
  upsertRadarItem,
} from '@/lib/radar/store'
import type { EnrichedCompany, RadarItem, RadarScore, TenderDraft } from '@/lib/radar/types'
import { sendRadarDigestEmail } from '@/lib/email'

export type RadarSyncSummary = {
  fetched: number
  kept: number
  scored: number
  companiesKept: number
  tendersKept: number
}

export async function runRadarSync(supabase: SupabaseClient, options?: { digest?: boolean }) {
  const runId = await startRadarRun(supabase)
  let fetched = 0
  let kept = 0
  let scored = 0
  let companiesKept = 0
  let tendersKept = 0
  const goTitles: string[] = []

  try {
    const drafts = await fetchRecentCompanies(3)
    const cheap = drafts.filter(item => cheapCompanyKeep(item.activity, item.legalFormLabel))
    fetched += drafts.length
    const enriched = await enrichCompanies(cheap, 36)

    for (const company of enriched) {
      const baseline = scoreCompanyDeterministic(company)
      if (!shouldKeepCompany(company, baseline)) continue
      const result = await upsertRadarItem(supabase, companyRow(company, baseline))
      if (result !== 'skipped') {
        kept += 1
        companiesKept += 1
      }
    }

    const tenders = await fetchItTenders(10, 40).catch(error => {
      console.error('[radar] BOAMP skipped', error)
      return [] as Awaited<ReturnType<typeof fetchItTenders>>
    })
    fetched += tenders.length
    for (const tender of tenders) {
      const baseline = scoreTenderDeterministic(tender)
      if (!shouldKeepTender(baseline)) continue
      const result = await upsertRadarItem(supabase, tenderRow(tender, baseline))
      if (result !== 'skipped') {
        kept += 1
        tendersKept += 1
      }
    }

    const pending = await listUnscored(supabase, 10)
    for (const item of pending) {
      try {
        const refined = await refineItem(item)
        const status = refined.fit === 'go' ? 'a_contacter' : item.status
        await supabase
          .from('radar_items')
          .update({
            score: refined.score,
            fit: refined.fit,
            offer: refined.offer,
            reasons: refined.reasons,
            next_action: refined.nextAction,
            approach_subject: refined.approachSubject || null,
            approach_body: refined.approachBody || null,
            status,
            scored_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
        scored += 1
        if (refined.fit === 'go') goTitles.push(`${item.title} (${refined.score})`)
      } catch (error) {
        console.error('[radar] AI score failed', item.id, error)
        await supabase
          .from('radar_items')
          .update({
            score: item.pre_score,
            fit: item.fit,
            scored_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      }
    }

    const summary = { fetched, kept, scored, companiesKept, tendersKept }
    await finishRadarRun(supabase, runId, { status: 'done', ...summary, summary })

    if (options?.digest !== false && goTitles.length) {
      await sendRadarDigestEmail({
        count: goTitles.length,
        lines: goTitles.slice(0, 8),
      }).catch(error => console.error('[radar] digest failed', error))
    }

    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync radar impossible'
    await finishRadarRun(supabase, runId, {
      status: 'error',
      fetched,
      kept,
      scored,
      error: message,
      summary: { fetched, kept, scored, companiesKept, tendersKept },
    })
    throw error
  }
}

async function refineItem(item: RadarItem): Promise<RadarScore> {
  const baseline: RadarScore = {
    preScore: item.pre_score,
    score: item.score ?? item.pre_score,
    fit: item.fit ?? 'possible',
    offer: item.offer ?? 'skip',
    reasons: item.reasons,
    nextAction: item.next_action || '',
    approachSubject: item.approach_subject || '',
    approachBody: item.approach_body || '',
  }

  if (item.kind === 'marche') {
    const tender: TenderDraft = {
      kind: 'marche',
      source: 'boamp',
      externalId: item.external_id,
      title: item.title,
      buyer: item.subtitle,
      city: item.city,
      department: item.department,
      publishedAt: item.published_at,
      deadlineAt: item.deadline_at,
      url: item.url,
      payload: item.payload,
    }
    return refineTenderScore(tender, baseline)
  }

  const company = {
    kind: item.kind as EnrichedCompany['kind'],
    source: 'bodacc' as const,
    externalId: item.external_id,
    siren: item.external_id,
    title: item.title,
    activity: String(item.payload.activity ?? item.subtitle ?? ''),
    city: item.city,
    department: item.department,
    publishedAt: item.published_at,
    url: item.url,
    contactName: item.contact_name,
    legalFormLabel: String(item.payload.legalForm ?? ''),
    payload: item.payload,
    naf: (item.payload.naf as string | null) ?? null,
    nafLabel: null,
    natureJuridique: (item.payload.natureJuridique as string | null) ?? null,
    legalForm: (item.payload.legalForm as string | null) ?? null,
    employer: Boolean(item.payload.employer),
    staffBand: (item.payload.staffBand as string | null) ?? null,
    directors: item.contact_name ? [item.contact_name] : [],
    sireneName: item.title,
    address: (item.payload.address as string | null) ?? null,
  }
  return refineCompanyScore(company, baseline)
}

function companyRow(company: EnrichedCompany, score: RadarScore) {
  return {
    kind: company.kind,
    source: company.source,
    external_id: company.siren,
    title: company.title,
    subtitle: [company.legalForm, company.naf, company.activity].filter(Boolean).join(' · ').slice(0, 220) || null,
    city: company.city,
    department: company.department,
    published_at: company.publishedAt,
    deadline_at: null,
    url: company.url,
    contact_name: company.contactName,
    payload: {
      ...company.payload,
      activity: company.activity,
      naf: company.naf,
      natureJuridique: company.natureJuridique,
      legalForm: company.legalForm,
      employer: company.employer,
      staffBand: company.staffBand,
      address: company.address,
    },
    pre_score: score.preScore,
    score: score.score,
    fit: score.fit,
    offer: score.offer,
    reasons: score.reasons,
    next_action: score.nextAction,
    status: score.fit === 'nogo' ? 'ecarte' : 'nouveau',
  }
}

function tenderRow(tender: TenderDraft, score: RadarScore) {
  return {
    kind: 'marche' as const,
    source: tender.source,
    external_id: tender.externalId,
    title: tender.title,
    subtitle: tender.buyer,
    city: tender.city,
    department: tender.department,
    published_at: tender.publishedAt,
    deadline_at: tender.deadlineAt,
    url: tender.url,
    contact_name: null,
    payload: tender.payload,
    pre_score: score.preScore,
    score: score.score,
    fit: score.fit,
    offer: score.offer,
    reasons: score.reasons,
    next_action: score.nextAction,
    status: score.fit === 'nogo' ? 'ecarte' : 'nouveau',
  }
}
