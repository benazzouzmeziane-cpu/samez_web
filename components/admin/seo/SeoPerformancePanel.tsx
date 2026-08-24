'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { readApiJson } from '@/lib/seo/http'

type PageMetric = {
  page_path: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  period_start: string
  period_end: string
}

type QueryMetric = {
  query: string
  page_path: string | null
  clicks: number
  impressions: number
  position: number
  period_start: string
  period_end: string
}

type LeadMetric = {
  pagePath: string
  contacts: number
  bookings: number
  total: number
}

type RoiMetric = {
  pagePath: string
  impressions: number
  clicks: number
  position: number
  leads: number
  contacts: number
  bookings: number
  crmProspects: number
}

export default function SeoPerformancePanel({
  configured,
  statusMessage,
  initialPages,
  initialQueries,
  initialLeads,
  initialRoi,
  leadTotals,
}: {
  configured: boolean
  statusMessage: string | null
  initialPages: PageMetric[]
  initialQueries: QueryMetric[]
  initialLeads: LeadMetric[]
  initialRoi: RoiMetric[]
  leadTotals: { contacts: number; bookings: number; total: number }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function syncGsc() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/seo/gsc', { method: 'POST' })
      const json = await readApiJson<{
        ok?: boolean
        summary?: { pages: number; queries: number; periodStart: string; periodEnd: string }
        error?: string
      }>(response)
      if (json.error) throw new Error(json.error)
      setMessage(
        `Synchronisation terminée : ${json.summary?.pages ?? 0} pages, ${json.summary?.queries ?? 0} requêtes (${json.summary?.periodStart} → ${json.summary?.periodEnd}).`
      )
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronisation impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Search Console</h2>
            <p className="text-sm text-slate-500 mt-1">
              Données réelles des 28 derniers jours pour prioriser les opportunités et mesurer l’impact des pages publiées.
            </p>
          </div>
          <button
            type="button"
            disabled={!configured || loading}
            onClick={syncGsc}
            className="btn btn-primary !py-2.5 !px-4 disabled:opacity-50"
          >
            {loading ? 'Synchronisation…' : 'Synchroniser GSC'}
          </button>
        </div>
        {statusMessage ? <p className="text-sm text-amber-700">{statusMessage}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Leads par page d’entrée</h3>
            <p className="text-sm text-slate-500 mt-1">
              Messages et RDV attribués à la première page visitée (cookie first-party, 30 jours).
            </p>
          </div>
          <p className="text-sm text-slate-600">
            {leadTotals.total} lead{leadTotals.total > 1 ? 's' : ''} · {leadTotals.contacts} message
            {leadTotals.contacts > 1 ? 's' : ''} · {leadTotals.bookings} RDV
          </p>
        </div>
        {initialLeads.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Aucun lead attribué pour l’instant. Les prochains contacts et RDV afficheront leur page d’entrée ici.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {initialLeads.map(lead => (
              <li key={lead.pagePath} className="px-5 py-3 text-sm">
                <p className="font-medium truncate">{lead.pagePath}</p>
                <p className="text-slate-500 mt-1">
                  {lead.total} lead{lead.total > 1 ? 's' : ''} · {lead.contacts} message
                  {lead.contacts > 1 ? 's' : ''} · {lead.bookings} RDV
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <h3 className="font-semibold">ROI par page</h3>
          <p className="text-sm text-slate-500 mt-1">
            Fusion Search Console, leads attribués et prospects CRM créés automatiquement (source SEO).
          </p>
        </div>
        {initialRoi.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Synchronisez GSC et attendez les premiers leads pour voir le tableau ROI.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3 font-medium">Page</th>
                  <th className="px-3 py-3 font-medium">Impr.</th>
                  <th className="px-3 py-3 font-medium">Clics</th>
                  <th className="px-3 py-3 font-medium">Pos.</th>
                  <th className="px-3 py-3 font-medium">Leads</th>
                  <th className="px-5 py-3 font-medium">CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {initialRoi.map(row => (
                  <tr key={row.pagePath}>
                    <td className="px-5 py-3 font-medium max-w-[14rem] truncate">{row.pagePath}</td>
                    <td className="px-3 py-3 text-slate-600">{row.impressions || '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{row.clicks || '—'}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {row.position > 0 ? row.position.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {row.leads > 0 ? (
                        <>
                          {row.leads}
                          <span className="text-slate-400 text-xs">
                            {' '}
                            ({row.contacts}m · {row.bookings}rdv)
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.crmProspects > 0 ? row.crmProspects : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h3 className="font-semibold">Pages les plus cliquées</h3>
          </div>
          {initialPages.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Aucune donnée synchronisée pour l’instant.</p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {initialPages.map(page => (
                <li key={`${page.page_path}-${page.period_end}`} className="px-5 py-3 text-sm">
                  <p className="font-medium truncate">{page.page_path}</p>
                  <p className="text-slate-500 mt-1">
                    {page.clicks} clics · {page.impressions} impressions · position {page.position.toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h3 className="font-semibold">Requêtes avec le plus d’impressions</h3>
          </div>
          {initialQueries.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Aucune requête synchronisée pour l’instant.</p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {initialQueries.map(query => (
                <li key={`${query.query}-${query.page_path || 'none'}`} className="px-5 py-3 text-sm">
                  <p className="font-medium">{query.query}</p>
                  <p className="text-slate-500 mt-1">
                    {query.impressions} impressions · {query.clicks} clics · position {query.position.toFixed(1)}
                    {query.page_path ? ` · ${query.page_path}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
