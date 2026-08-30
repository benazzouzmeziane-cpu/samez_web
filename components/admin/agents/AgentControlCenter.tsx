'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AgentDashboard, AgentDomain, AgentRun } from '@/lib/agents/types'

const TABS = [
  { id: 'missions', label: 'Missions' },
  { id: 'journal', label: 'Journal' },
  { id: 'memoire', label: 'Mémoire' },
  { id: 'approbations', label: 'Approbations' },
] as const

type TabId = (typeof TABS)[number]['id']

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

type ReviewAction = {
  rank: number
  actionType: string
  title: string
  target: string
  deadline: string
  metric: string
  expectedImpact: string
  evidence: Array<{ source: string; reference: string }>
  requiresApproval: boolean
}

type Review = {
  score?: number
  finalSummary?: string
  blockers?: string[]
  actions?: ReviewAction[]
}

function reviewOf(run: AgentRun): Review {
  return (run.result?.review ?? {}) as Review
}

function runStatus(run: AgentRun) {
  return run.status === 'done' && Boolean(run.error) ? 'review_rejected' : run.status
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
  const [tab, setTab] = useState<TabId>('missions')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    initial.runs.find(item => item.status === 'running' || item.status === 'queued')?.id ??
      initial.runs[0]?.id ??
      null,
  )

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

  useEffect(() => {
    if (selectedRunId && data.runs.some(item => item.id === selectedRunId)) return
    setSelectedRunId(
      data.runs.find(item => item.status === 'running' || item.status === 'queued')?.id ??
        data.runs[0]?.id ??
        null,
    )
  }, [data.runs, selectedRunId])

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
      setTab('missions')
      if (json.runId) setSelectedRunId(json.runId)
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
    decision: 'approve' | 'reject' | 'execute',
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
  const selectedRun = data.runs.find(item => item.id === selectedRunId) ?? null
  const tabCounts: Record<TabId, number> = {
    missions: data.runs.length,
    journal: data.events.length,
    memoire: proposed.length,
    approbations: pendingApprovals.length,
  }
  const tabWarn: Record<TabId, boolean> = {
    missions: data.runs.some(item => item.status === 'running' || item.status === 'queued'),
    journal: false,
    memoire: proposed.length > 0,
    approbations: pendingApprovals.length > 0,
  }

  return (
    <div className="space-y-5">
      {!configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Orchestrateur non configuré : ajoutez SEO_AGENT_URL et SEO_AGENT_SECRET sur Vercel, puis
          déployez le Worker Cloudflare.
        </div>
      ) : null}

      <form onSubmit={launch} className="rounded-2xl border border-black/[0.06] bg-white p-4 md:p-5">
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

      <div className="flex flex-wrap gap-2">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`client-press inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              tab === item.id
                ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
                : 'border-black/[0.08] text-slate-600 bg-white'
            }`}
          >
            {item.label}
            <span
              className={`min-w-5 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                tab === item.id
                  ? 'bg-white/15 text-white'
                  : tabWarn[item.id]
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tabCounts[item.id]}
            </span>
          </button>
        ))}
      </div>

      {tab === 'missions' ? (
        <MissionsPane
          runs={data.runs}
          selected={selectedRun}
          onSelect={setSelectedRunId}
        />
      ) : null}

      {tab === 'journal' ? <JournalPane events={data.events} /> : null}

      {tab === 'memoire' ? (
        <MemoryPane memories={data.memories} onDecide={decide} />
      ) : null}

      {tab === 'approbations' ? (
        <ApprovalsPane approvals={data.approvals} onDecide={decide} />
      ) : null}
    </div>
  )
}

function MissionsPane({
  runs,
  selected,
  onSelect,
}: {
  runs: AgentRun[]
  selected: AgentRun | null
  onSelect: (id: string) => void
}) {
  if (runs.length === 0) {
    return <Empty text="Aucune mission multi-agent." />
  }

  return (
    <div className="grid lg:grid-cols-[18.5rem_minmax(0,1fr)] gap-4 items-start">
      <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden max-h-[32rem] overflow-y-auto">
        {runs.map(run => {
          const active = selected?.id === run.id
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelect(run.id)}
              className={`client-press w-full text-left px-4 py-3 border-b border-black/[0.06] last:border-b-0 ${
                active ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium line-clamp-2 ${active ? 'text-[var(--navy)]' : ''}`}>
                  {run.objective}
                </p>
                <Status value={runStatus(run)} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {DOMAIN_LABELS[run.domain]} · {new Date(run.created_at).toLocaleString('fr-FR')}
              </p>
            </button>
          )
        })}
      </div>
      <MissionDetail run={selected} />
    </div>
  )
}

function MissionDetail({ run }: { run: AgentRun | null }) {
  const review = useMemo(() => (run ? reviewOf(run) : {}), [run])
  if (!run) return <Empty text="Sélectionnez une mission." />

  const attempts = Number(run.result?.attempts ?? 1)
  const actions = [...(review.actions ?? [])].sort((left, right) => left.rank - right.rank)

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{run.objective}</p>
          <p className="text-xs text-slate-500 mt-1">
            {DOMAIN_LABELS[run.domain]} · {new Date(run.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <Status value={runStatus(run)} />
      </div>

      {review.finalSummary ? <p className="text-sm text-slate-600">{review.finalSummary}</p> : null}

      {actions.length ? (
        <ol className="grid md:grid-cols-2 gap-2 mt-4">
          {actions.map(action => (
            <li key={`${run.id}-${action.rank}`} className="rounded-lg border border-black/[0.06] bg-slate-50 p-3">
              <p className="text-sm font-medium">
                {action.rank}. {action.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">Cible : {action.target}</p>
              <p className="text-xs text-slate-600 mt-1">
                Échéance : {action.deadline} · Mesure : {action.metric}
              </p>
              <p className="text-xs text-slate-600 mt-1">Impact attendu : {action.expectedImpact}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {action.requiresApproval
                  ? `Validation humaine requise · ${action.actionType}`
                  : 'Action interne sans écriture externe'}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Preuves : {action.evidence.map(item => `${item.source} → ${item.reference}`).join(' · ')}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-4 text-xs text-slate-500">
        {review.score != null ? <span>Critique : {Math.round(review.score)}/100</span> : null}
        {attempts > 1 ? <span>· {attempts} passes</span> : null}
        <span>Tokens : {run.prompt_tokens + run.completion_tokens}</span>
        {run.model ? <span>· {run.model}</span> : null}
      </div>
      {run.error ? <p className="text-xs text-red-600 mt-2">{run.error}</p> : null}
    </article>
  )
}

function JournalPane({ events }: { events: AgentDashboard['events'] }) {
  if (events.length === 0) return <Empty text="Aucun échange inter-agent." />

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white divide-y divide-black/[0.05] max-h-[36rem] overflow-y-auto">
      {events.slice(0, 40).map(event => (
        <div key={event.id} className="px-4 py-3 flex gap-3 text-sm">
          <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
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
  )
}

function MemoryPane({
  memories,
  onDecide,
}: {
  memories: AgentDashboard['memories']
  onDecide: (target: 'memory', id: string, decision: 'approve' | 'reject') => void
}) {
  if (memories.length === 0) return <Empty text="Aucune mémoire enregistrée." />

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {memories.map(memory => (
        <article key={memory.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm">{memory.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {memory.domain} · {memory.kind} · {memory.source_agent || memory.source_type}
              </p>
            </div>
            <Status value={memory.status} />
          </div>
          <p className="text-sm text-slate-600 mt-3 line-clamp-6">{memory.content}</p>
          {memory.status === 'proposed' ? (
            <div className="flex gap-2 mt-3">
              <DecisionButton onClick={() => onDecide('memory', memory.id, 'approve')}>Valider</DecisionButton>
              <DecisionButton danger onClick={() => onDecide('memory', memory.id, 'reject')}>
                Rejeter
              </DecisionButton>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function ApprovalsPane({
  approvals,
  onDecide,
}: {
  approvals: AgentDashboard['approvals']
  onDecide: (target: 'approval', id: string, decision: 'approve' | 'reject' | 'execute') => void
}) {
  if (approvals.length === 0) return <Empty text="Aucune action externe demandée." />

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {approvals.map(approval => (
        <article key={approval.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
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
              <DecisionButton onClick={() => onDecide('approval', approval.id, 'approve')}>
                Approuver
              </DecisionButton>
              <DecisionButton danger onClick={() => onDecide('approval', approval.id, 'reject')}>
                Refuser
              </DecisionButton>
            </div>
          ) : null}
          {approval.status === 'approved' ||
          (approval.status === 'failed' && approval.execution_attempts < 3) ? (
            <div className="flex gap-2 mt-3">
              <DecisionButton onClick={() => onDecide('approval', approval.id, 'execute')}>
                {approval.status === 'failed' ? 'Réessayer' : 'Exécuter'}
              </DecisionButton>
            </div>
          ) : null}
          {approval.status === 'failed' && approval.execution_attempts >= 3 ? (
            <p className="text-xs text-red-700 mt-2">
              Trois tentatives effectuées — intervention manuelle requise.
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function Status({ value }: { value: string }) {
  const warning = ['pending', 'proposed', 'waiting_approval', 'executing', 'queued', 'running'].includes(value)
  const failed = ['error', 'failed', 'rejected', 'review_rejected', 'cancelled'].includes(value)
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
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
      className={`client-press rounded-lg border px-3 py-2 text-xs font-medium ${
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
    <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}
