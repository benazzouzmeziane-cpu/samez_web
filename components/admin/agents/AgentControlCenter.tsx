'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AgentDashboard, AgentDomain } from '@/lib/agents/types'

const DOMAIN_LABELS: Record<AgentDomain, string> = {
  global: 'Toute l’entreprise',
  seo: 'SEO',
  radar: 'Radar',
  crm: 'CRM',
  analytics: 'Analytics',
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'En attente',
  running: 'En cours',
  waiting_approval: 'Validation requise',
  done: 'Terminé',
  review_rejected: 'Analyse rejetée',
  error: 'Erreur',
  cancelled: 'Annulé',
  proposed: 'À valider',
  validated: 'Validée',
  rejected: 'Rejetée',
  approved: 'Approuvée',
  executing: 'Exécution…',
  executed: 'Exécutée',
  failed: 'Échec',
  pending: 'À valider',
}

export default function AgentControlCenter({
  initial,
  configured,
}: {
  initial: AgentDashboard
  configured: boolean
}) {
  const router = useRouter()
  const [data, setData] = useState(initial)
  const [objective, setObjective] = useState('')
  const [domain, setDomain] = useState<AgentDomain>('global')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const running = data.runs.find(item => item.status === 'running' || item.status === 'queued')
    if (!running) return
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/admin/agents?runId=${encodeURIComponent(running.id)}`, {
        cache: 'no-store',
      })
      if (!response.ok) return
      const json = (await response.json()) as AgentDashboard
      setData(json)
      router.refresh()
    }, 3500)
    return () => window.clearInterval(timer)
  }, [data.runs, router])

  async function launch(event: React.FormEvent) {
    event.preventDefault()
    if (!objective.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, domain }),
      })
      const json = (await response.json()) as { error?: string; runId?: string }
      if (!response.ok) throw new Error(json.error || 'Mission impossible')
      setObjective('')
      const refreshed = await fetch(`/api/admin/agents?runId=${encodeURIComponent(json.runId || '')}`, {
        cache: 'no-store',
      })
      if (refreshed.ok) setData((await refreshed.json()) as AgentDashboard)
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mission impossible')
    } finally {
      setLoading(false)
    }
  }

  async function decide(
    target: 'memory' | 'approval',
    id: string,
    decision: 'approve' | 'reject' | 'execute'
  ) {
    setError(null)
    const response = await fetch('/api/admin/agents/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, id, decision }),
    })
    const json = (await response.json()) as { error?: string }
    const refreshed = await fetch('/api/admin/agents', { cache: 'no-store' })
    if (refreshed.ok) setData((await refreshed.json()) as AgentDashboard)
    if (!response.ok) {
      setError(json.error || 'Décision impossible')
      return
    }
    router.refresh()
  }

  const proposed = data.memories.filter(item => item.status === 'proposed')
  const pendingApprovals = data.approvals.filter(item => item.status === 'pending')

  return (
    <div className="space-y-6">
      {!configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Orchestrateur non configuré : ajoutez SEO_AGENT_URL et SEO_AGENT_SECRET sur Vercel, puis
          déployez le Worker Cloudflare.
        </div>
      ) : null}

      <form onSubmit={launch} className="rounded-2xl border border-black/[0.06] bg-white p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <textarea
            value={objective}
            onChange={event => setObjective(event.target.value)}
            rows={2}
            placeholder="Ex. Analyse le SEO, le Radar et le CRM puis propose les trois actions les plus rentables cette semaine."
            className="flex-1 resize-none rounded-xl border border-black/[0.08] bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[var(--accent-dark)] focus:bg-white"
          />
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
            <select
              value={domain}
              onChange={event => setDomain(event.target.value as AgentDomain)}
              className="h-11 rounded-lg border border-black/[0.08] bg-white px-3 text-sm outline-none"
            >
              {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!configured || loading || objective.trim().length < 5}
              className="btn btn-primary !py-3 disabled:opacity-50"
            >
              {loading ? 'Planification…' : 'Lancer la mission'}
            </button>
          </div>
        </div>
        {error ? <p className="text-xs text-red-600 mt-2">{error}</p> : null}
      </form>

      <div className="grid sm:grid-cols-3 gap-3">
        <Metric label="Missions" value={data.runs.length} />
        <Metric label="Mémoires à valider" value={proposed.length} tone={proposed.length ? 'warn' : 'normal'} />
        <Metric
          label="Actions à approuver"
          value={pendingApprovals.length}
          tone={pendingApprovals.length ? 'warn' : 'normal'}
        />
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Missions récentes</h2>
        <div className="space-y-3">
          {data.runs.length === 0 ? (
            <Empty text="Aucune mission multi-agent." />
          ) : (
            data.runs.map(run => {
              const review = (run.result?.review ?? {}) as {
                score?: number
                finalSummary?: string
                blockers?: string[]
                actions?: Array<{
                  rank: number
                  actionType: string
                  title: string
                  target: string
                  deadline: string
                  metric: string
                  expectedImpact: string
                  evidence: Array<{ source: string; reference: string }>
                  requiresApproval: boolean
                }>
              }
              const attempts = Number(run.result?.attempts ?? 1)
              const rejected = run.status === 'done' && Boolean(run.error)
              return (
                <article key={run.id} className="rounded-xl border border-black/[0.06] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{run.objective}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {DOMAIN_LABELS[run.domain]} · {new Date(run.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Status value={rejected ? 'review_rejected' : run.status} />
                  </div>
                  {review.finalSummary ? (
                    <p className="text-sm text-slate-600 mt-3">{review.finalSummary}</p>
                  ) : null}
                  {review.actions?.length ? (
                    <ol className="grid gap-2 mt-4">
                      {[...review.actions]
                        .sort((left, right) => left.rank - right.rank)
                        .map(action => (
                          <li
                            key={`${run.id}-${action.rank}`}
                            className="rounded-lg border border-black/[0.06] bg-slate-50 p-3"
                          >
                            <p className="text-sm font-medium">
                              {action.rank}. {action.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">Cible : {action.target}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              Échéance : {action.deadline} · Mesure : {action.metric}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Impact attendu : {action.expectedImpact}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {action.requiresApproval
                                ? `Validation humaine requise · ${action.actionType}`
                                : 'Action interne sans écriture externe'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-2">
                              Preuves :{' '}
                              {action.evidence
                                .map(item => `${item.source} → ${item.reference}`)
                                .join(' · ')}
                            </p>
                          </li>
                        ))}
                    </ol>
                  ) : null}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                    {review.score != null ? <span>Critique : {Math.round(review.score)}/100</span> : null}
                    {attempts > 1 ? <span>· {attempts} passes</span> : null}
                    <span>
                      Tokens : {run.prompt_tokens + run.completion_tokens}
                    </span>
                    {run.model ? <span>· {run.model}</span> : null}
                  </div>
                  {run.error ? <p className="text-xs text-red-600 mt-2">{run.error}</p> : null}
                </article>
              )
            })
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Communication des agents</h2>
        {data.events.length === 0 ? (
          <Empty text="Aucun échange inter-agent." />
        ) : (
          <div className="rounded-xl border border-black/[0.06] bg-white divide-y divide-black/[0.05]">
            {data.events.slice(0, 30).map(event => (
              <div key={event.id} className="px-4 py-3 flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-700">
                    <span className="font-medium">{event.source_agent}</span>
                    {event.target_agent ? ` → ${event.target_agent}` : ''} : {event.summary}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {event.event_type} · {new Date(event.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Mémoire persistante</h2>
        <div className="space-y-3">
          {data.memories.length === 0 ? (
            <Empty text="Aucune mémoire enregistrée." />
          ) : (
            data.memories.map(memory => (
              <article key={memory.id} className="rounded-xl border border-black/[0.06] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{memory.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {memory.domain} · {memory.kind} · {memory.source_agent || memory.source_type}
                    </p>
                  </div>
                  <Status value={memory.status} />
                </div>
                <p className="text-sm text-slate-600 mt-3">{memory.content}</p>
                {memory.status === 'proposed' ? (
                  <div className="flex gap-2 mt-3">
                    <DecisionButton onClick={() => decide('memory', memory.id, 'approve')}>
                      Valider
                    </DecisionButton>
                    <DecisionButton danger onClick={() => decide('memory', memory.id, 'reject')}>
                      Rejeter
                    </DecisionButton>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Approbations humaines</h2>
        <div className="space-y-3">
          {data.approvals.length === 0 ? (
            <Empty text="Aucune action externe demandée." />
          ) : (
            data.approvals.map(approval => (
              <article key={approval.id} className="rounded-xl border border-black/[0.06] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{approval.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {approval.action_type} · risque {approval.risk}
                    </p>
                  </div>
                  <Status value={approval.status} />
                </div>
                <p className="text-sm text-slate-600 mt-3">{approval.summary}</p>
                {approval.execution_error ? (
                  <p className="text-xs text-red-600 mt-2">{approval.execution_error}</p>
                ) : null}
                {approval.status === 'executed' && approval.executed_at ? (
                  <p className="text-xs text-emerald-700 mt-2">
                    Exécutée le {new Date(approval.executed_at).toLocaleString('fr-FR')}
                  </p>
                ) : null}
                {approval.status === 'pending' ? (
                  <div className="flex gap-2 mt-3">
                    <DecisionButton onClick={() => decide('approval', approval.id, 'approve')}>
                      Approuver
                    </DecisionButton>
                    <DecisionButton danger onClick={() => decide('approval', approval.id, 'reject')}>
                      Refuser
                    </DecisionButton>
                  </div>
                ) : null}
                {approval.status === 'approved' || approval.status === 'failed' ? (
                  <div className="flex gap-2 mt-3">
                    <DecisionButton onClick={() => decide('approval', approval.id, 'execute')}>
                      {approval.status === 'failed' ? 'Réessayer' : 'Exécuter'}
                    </DecisionButton>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: number
  tone?: 'normal' | 'warn'
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-display text-2xl font-semibold mt-1 ${tone === 'warn' ? 'text-amber-700' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function Status({ value }: { value: string }) {
  const warning = ['pending', 'proposed', 'waiting_approval', 'executing'].includes(value)
  const failed = ['error', 'failed', 'rejected', 'review_rejected', 'cancelled'].includes(value)
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        failed
          ? 'bg-red-50 text-red-700'
          : warning
            ? 'bg-amber-50 text-amber-700'
            : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {STATUS_LABELS[value] || value}
    </span>
  )
}

function DecisionButton({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-medium active:scale-[0.97] transition-transform duration-150 ${
        danger
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/[0.08] bg-white px-4 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}
