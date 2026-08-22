export const dynamic = 'force-dynamic'

import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SeoPerformancePanel from '@/components/admin/seo/SeoPerformancePanel'
import { isGscConfigured } from '@/lib/seo/gsc/client'
import {
  gscStatusMessage,
  latestGscPageMetrics,
  latestGscQueryMetrics,
} from '@/lib/seo/gsc/store'
import { leadStatsByPage, leadTotals } from '@/lib/seo/lead-attribution'

export default async function SeoPerformancePage() {
  let pages: Awaited<ReturnType<typeof latestGscPageMetrics>> = []
  let queries: Awaited<ReturnType<typeof latestGscQueryMetrics>> = []
  let leads: Awaited<ReturnType<typeof leadStatsByPage>> = []
  let totals = { contacts: 0, bookings: 0, total: 0, pages: 0 }
  try {
    ;[pages, queries, leads, totals] = await Promise.all([
      latestGscPageMetrics(40),
      latestGscQueryMetrics(40),
      leadStatsByPage(20),
      leadTotals(),
    ])
  } catch {
    pages = []
    queries = []
    leads = []
  }

  return (
    <div>
      <AdminPageHeader
        title="Performance SEO"
        description="Search Console, priorités basées sur les données réelles et suivi des pages publiées."
        actions={
          <Link
            href="/admin/seo"
            className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10"
          >
            Retour aux contenus
          </Link>
        }
      />
      <SeoPerformancePanel
        configured={isGscConfigured()}
        statusMessage={gscStatusMessage()}
        initialPages={pages.map(row => ({
          page_path: String(row.page_path),
          clicks: Number(row.clicks ?? 0),
          impressions: Number(row.impressions ?? 0),
          ctr: Number(row.ctr ?? 0),
          position: Number(row.position ?? 0),
          period_start: String(row.period_start),
          period_end: String(row.period_end),
        }))}
        initialQueries={queries.map(row => ({
          query: String(row.query),
          page_path: row.page_path ? String(row.page_path) : null,
          clicks: Number(row.clicks ?? 0),
          impressions: Number(row.impressions ?? 0),
          position: Number(row.position ?? 0),
          period_start: String(row.period_start),
          period_end: String(row.period_end),
        }))}
        initialLeads={leads}
        leadTotals={{ contacts: totals.contacts, bookings: totals.bookings, total: totals.total }}
      />
    </div>
  )
}
