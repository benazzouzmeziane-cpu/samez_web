import type { SupabaseClient } from '@supabase/supabase-js'
import { buildAgentContext } from '@/lib/agents/context'
import { getAgentMissionStatus, startAgentMission } from '@/lib/agents/cloudflare'
import {
  addAgentEvent,
  createAgentRun,
  createAgentTasks,
  memoryContext,
  proposeAgentMemory,
  updateAgentRun,
} from '@/lib/agents/store'
import {
  AGENT_NAMES,
  type AgentDomain,
  type AgentName,
  type AgentPlanStep,
  type AgentRun,
} from '@/lib/agents/types'

export function defaultAgentPlan(domain: AgentDomain): AgentPlanStep[] {
  const steps: AgentPlanStep[] = []
  if (domain === 'global' || domain === 'seo') {
    steps.push({
      agent: 'seo-strategist',
      task: 'Analyser les opportunités SEO et proposer une priorité mesurable',
    })
  }
  if (domain === 'global' || domain === 'radar') {
    steps.push({
      agent: 'radar-agent',
      task: 'Qualifier les pistes et écarter les concurrents',
    })
  }
  if (domain === 'global' || domain === 'crm') {
    steps.push({
      agent: 'crm-agent',
      task: 'Analyser le pipeline et proposer les prochaines actions',
      approval: true,
    })
  }
  if (domain === 'global' || domain === 'analytics') {
    steps.push({
      agent: 'analyst-agent',
      task: 'Mesurer les performances et définir une expérience',
    })
  }
  steps.push({ agent: 'critic-agent', task: 'Contrôler les rapports et bloquer les risques' })
  return steps
}

export async function launchAgentMission(
  supabase: SupabaseClient,
  input: { objective: string; domain: AgentDomain; userId?: string; triggerType?: AgentRun['trigger_type'] }
) {
  const objective = input.objective.trim().slice(0, 2000)
  if (!objective) throw new Error('Objectif manquant')
  const plan = defaultAgentPlan(input.domain)
  const run = await createAgentRun(supabase, {
    objective,
    domain: input.domain,
    plan,
    triggerType: input.triggerType,
    createdBy: input.userId,
  })

  try {
    const [context, memories] = await Promise.all([
      buildAgentContext(supabase, input.domain),
      memoryContext(supabase, input.domain),
    ])
    await createAgentTasks(
      supabase,
      run.id,
      plan.filter(step => step.agent !== 'critic-agent'),
      { objective }
    )
    await addAgentEvent(supabase, {
      runId: run.id,
      sourceAgent: 'samez-orchestrator',
      type: 'planned',
      summary: `Mission planifiée dans le domaine ${input.domain}`,
      payload: { plan },
    })
    await startAgentMission({
      runId: run.id,
      objective,
      domain: input.domain,
      context,
      memories,
    })
    await supabase
      .from('agent_tasks')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('run_id', run.id)
      .eq('status', 'queued')
    await updateAgentRun(supabase, run.id, { status: 'running' })
    return run.id
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Orchestrateur indisponible'
    await updateAgentRun(supabase, run.id, { status: 'error', error: message })
    throw error
  }
}

function isAgentName(value: string): value is AgentName {
  return (AGENT_NAMES as readonly string[]).includes(value)
}

export async function refreshAgentMission(supabase: SupabaseClient, runId: string) {
  const { data: run, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
    .single()
  if (error || !run) throw new Error(error?.message || 'Mission introuvable')
  if (['done', 'error', 'cancelled'].includes(String(run.status))) return run as AgentRun

  const remote = await getAgentMissionStatus(runId)
  if (remote.status === 'pending' || remote.status === 'idle') return run as AgentRun
  if (remote.status === 'error') {
    await updateAgentRun(supabase, runId, {
      status: 'error',
      error: remote.error || 'Mission Cloudflare en erreur',
    })
    return { ...(run as AgentRun), status: 'error', error: remote.error || null }
  }

  const reports = remote.result?.reports ?? []
  const review = remote.result?.review ?? {}
  const approved = review.approved === true && Number(review.score ?? 0) >= 70
  const result = {
    reports,
    review,
    events: remote.events ?? [],
    attempts: remote.result?.attempts ?? 1,
  }

  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('id, assigned_agent')
    .eq('run_id', runId)

  for (const report of reports) {
    const task = (tasks ?? []).find(item => {
      const normalized = report.agent === 'seo-strategist-agent' ? 'seo-strategist' : report.agent
      return item.assigned_agent === normalized
    })
    if (task) {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'done',
          output: report,
          finished_at: new Date().toISOString(),
          attempts: 1,
        })
        .eq('id', task.id)
    }
    await addAgentEvent(supabase, {
      runId,
      taskId: task?.id,
      sourceAgent: report.agent,
      targetAgent: 'samez-orchestrator',
      type: 'completed',
      summary: report.summary,
    })

    const approvedMemoryKeys = new Set(review.approvedMemoryKeys ?? [])
    for (const memory of approved ? (report.proposedMemories ?? []) : []) {
      if (!approvedMemoryKeys.has(memory.key)) continue
      await proposeAgentMemory(supabase, {
        ...memory,
        sourceAgent: report.agent,
        sourceRefType: 'agent_run',
        sourceRefId: runId,
      }).catch(memoryError => console.error('[agents] memory', memoryError))
    }

  }

  if (approved) {
    const externalTypes = new Set([
      'publish_seo',
      'send_email',
      'convert_crm',
      'change_stage',
      'redirect',
      'external_write',
    ])
    const { data: existingApprovals } = await supabase
      .from('agent_approvals')
      .select('action_type, title')
      .eq('run_id', runId)
    for (const action of review.actions ?? []) {
      if (!action.requiresApproval || !externalTypes.has(action.actionType)) continue
      const duplicate = (existingApprovals ?? []).some(
        item => item.action_type === action.actionType && item.title === action.title
      )
      if (duplicate) continue
      await supabase.from('agent_approvals').insert({
        run_id: runId,
        action_type: action.actionType,
        risk: action.actionType === 'send_email' ? 'medium' : 'low',
        title: action.title.slice(0, 160),
        summary: [
          action.rationale,
          `Cible : ${action.target}`,
          `Échéance : ${action.deadline}`,
          `Mesure : ${action.metric}`,
          `Impact attendu : ${action.expectedImpact}`,
        ].join('\n'),
        payload: { action },
        status: 'pending',
      })
    }
  }

  for (const event of remote.events ?? []) {
    const source = isAgentName(event.source) ? event.source : 'samez-orchestrator'
    await addAgentEvent(supabase, {
      runId,
      sourceAgent: source,
      targetAgent: event.target,
      type:
        event.type === 'failed'
          ? 'failed'
          : event.type === 'completed'
            ? 'completed'
            : event.type === 'delegated'
              ? 'delegated'
              : 'message',
      summary: event.summary,
      payload: { remoteAt: event.at },
    }).catch(() => undefined)
  }

  const usage = remote.result?.usage
  await updateAgentRun(supabase, runId, {
    status: 'done',
    result,
    model: String(review.model || reports[0]?.model || 'workers-ai'),
    promptTokens: usage?.prompt ?? 0,
    completionTokens: usage?.completion ?? 0,
    error: approved ? null : `Contrôle critique non validé : ${(review.blockers ?? []).join(' · ')}`.slice(0, 1000),
  })
  const { data: completed } = await supabase.from('agent_runs').select('*').eq('id', runId).single()
  return (completed ?? run) as AgentRun
}
