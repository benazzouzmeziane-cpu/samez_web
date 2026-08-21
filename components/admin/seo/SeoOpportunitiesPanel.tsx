'use client'

import { useState } from 'react'
import Link from 'next/link'
import { readApiJson, waitForSeoResearch } from '@/lib/seo/http'
import {
  DEFAULT_RESEARCH_SEEDS,
  type SeoResearchResult,
} from '@/lib/seo/research-schema'
import { typeLabel } from '@/lib/seo/paths'

const inputClass =
  'w-full px-3 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg text-[var(--navy)]'

export default function SeoOpportunitiesPanel({
  initialResult,
  initialRunId,
}: {
  initialResult?: SeoResearchResult | null
  initialRunId?: string | null
}) {
  const [seeds, setSeeds] = useState(DEFAULT_RESEARCH_SEEDS.join('\n'))
  const [competitors, setCompetitors] = useState('')
  const [result, setResult] = useState<SeoResearchResult | null>(initialResult || null)
  const [runId, setRunId] = useState(initialRunId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function research(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/seo/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: seeds.split('\n').map(item => item.trim()).filter(Boolean),
          knownCompetitors: competitors
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean),
          audience: 'Dirigeants de TPE/PME et porteurs de projet',
          maxOpportunities: 10,
        }),
      })
      const started = await readApiJson<{ runId?: string; status?: string; error?: string }>(response)
      if (!response.ok || !started.runId) {
        throw new Error(started.error || 'Impossible de démarrer l’analyse')
      }
      setRunId(started.runId)
      const completed = await waitForSeoResearch<SeoResearchResult>(started.runId)
      if (!completed.result) throw new Error('Analyse terminée sans proposition')
      setResult(completed.result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Analyse impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={research} className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-[var(--navy)]">Analyser le marché français</h2>
          <p className="text-sm text-slate-500 mt-1">
            Brave découvre les résultats ; Browser Run lit samez.fr et les pages concurrentes. Aucun brouillon
            n’est créé automatiquement.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">
              Thèmes de départ (un par ligne, maximum 5)
            </span>
            <textarea
              value={seeds}
              onChange={event => setSeeds(event.target.value)}
              className={`${inputClass} min-h-32`}
              required
            />
          </label>
          <label>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">
              Concurrents à surveiller (optionnel)
            </span>
            <textarea
              value={competitors}
              onChange={event => setCompetitors(event.target.value)}
              className={`${inputClass} min-h-32`}
              placeholder={'visionia.io\ninno-mation.com\na2z-automation.com'}
            />
          </label>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading} className="btn btn-primary !py-2.5 !px-5 disabled:opacity-50">
          {loading ? 'Analyse du marché en cours…' : 'Analyser le marché'}
        </button>
        {loading ? (
          <p className="text-xs text-slate-500">
            La recherche peut prendre plusieurs minutes. Vous pouvez laisser cet onglet ouvert.
          </p>
        ) : null}
      </form>

      {result ? (
        <>
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--navy)]">Synthèse du marché</h2>
              <span className="text-xs text-slate-400">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(result.researchedAt))}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-3">{result.summary}</p>
            {result.reviewFlags.length ? (
              <ul className="mt-3 space-y-1 text-xs text-amber-700">
                {result.reviewFlags.map(flag => <li key={flag}>À vérifier : {flag}</li>)}
              </ul>
            ) : null}
          </section>

          {result.competitors.length ? (
            <section>
              <h2 className="font-semibold text-[var(--navy)] mb-3">Concurrents consultés</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {result.competitors.map(competitor => (
                  <article key={competitor.domain} className="rounded-xl border border-black/[0.06] bg-white p-4">
                    <h3 className="text-sm font-semibold">{competitor.domain}</h3>
                    <p className="text-sm text-slate-500 mt-1">{competitor.positioning}</p>
                    {competitor.gaps.length ? (
                      <p className="text-xs text-slate-500 mt-3">
                        Lacunes : {competitor.gaps.join(' · ')}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {competitor.urls.slice(0, 3).map(url => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent-dark)] underline"
                        >
                          Source
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="font-semibold text-[var(--navy)] mb-3">
              Opportunités proposées ({result.opportunities.length})
            </h2>
            <div className="space-y-4">
              {result.opportunities.map(opportunity => (
                <article key={opportunity.id} className="rounded-2xl border border-black/[0.06] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-[11px] rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 font-medium">
                          Score {Math.round(opportunity.score)}/100
                        </span>
                        <span className="text-[11px] rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">
                          {typeLabel(opportunity.type)}
                        </span>
                        <span className="text-[11px] rounded-md bg-slate-100 text-slate-600 px-2 py-0.5">
                          {opportunity.searchIntent}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[var(--navy)]">{opportunity.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">/{opportunity.slug}</p>
                    </div>
                    <Link
                      href={`/admin/seo/nouveau?runId=${encodeURIComponent(runId)}&opportunity=${encodeURIComponent(opportunity.id)}`}
                      className="btn btn-primary !py-2 !px-4"
                    >
                      Préremplir une page
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-4">{opportunity.rationale}</p>
                  <p className="text-sm text-slate-500 mt-3">
                    <span className="font-medium text-slate-700">Angle :</span> {opportunity.angle}
                  </p>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500">Lacunes à couvrir</p>
                    <ul className="list-disc pl-5 mt-1 text-sm text-slate-500">
                      {opportunity.contentGap.map(gap => <li key={gap}>{gap}</li>)}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {opportunity.sources.map(source => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent-dark)] underline"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
