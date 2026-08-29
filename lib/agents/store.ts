import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AgentApproval,
  AgentDashboard,
  AgentDomain,
  AgentEvent,
  AgentMemory,
  AgentPlanStep,
  AgentRun,
  AgentRunStatus,
  AgentTask,
} from '@/lib/agents/types'

export async function listAgentMemories(
  supabase: SupabaseClient,
  options?: { domain?: AgentDomain; status?: AgentMemory['status']; limit?: number }
) {
  let query = supabase
    .from('agent_memories')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(options?.limit ?? 60)
  if (options?.domain) query = query.in('domain', ['global', options.domain])
  if (options?.status) query = query.eq('status', options.status)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentMemory[]
}

export async function memoryContext(supabase: SupabaseClient, domain: AgentDomain, limit = 24) {
  const memories = await listAgentMemories(supabase, { domain, status: 'validated', limit })
  return memories
    .filter(item => !item.expires_at || new Date(item.expires_at).getTime() > Date.now())
    .map(item => ({
      key: item.key,
      kind: item.kind,
      content: item.content,
      payload: item.payload,
      confidence: item.confidence,
    }))
}

export async function proposeAgentMemory(
  supabase: SupabaseClient,
  input: {
    domain: AgentDomain
    kind: AgentMemory['kind']
    key: string
    title: string
    content: string
    payload?: Record<string, unknown>
    sourceAgent: string
    sourceRefType?: string
    sourceRefId?: string
    confidence?: number
    tags?: string[]
    expiresAt?: string
  }
) {
  const row = {
    domain: input.domain,
    kind: input.kind,
    key: input.key,
    title: input.title.slice(0, 160),
    content: input.content.slice(0, 4000),
    payload: input.payload ?? {},
    source_type: 'agent',
    source_agent: input.sourceAgent,
    source_ref_type: input.sourceRefType ?? null,
    source_ref_id: input.sourceRefId ?? null,
    confidence: input.confidence == null ? null : Math.max(0, Math.min(1, input.confidence)),
    tags: input.tags ?? [],
    expires_at: input.expiresAt ?? null,
    status: 'proposed',
    updated_at: new Date().toISOString(),
  }
  const { data: existing } = await supabase
    .from('agent_memories')
    .select('id, status')
    .eq('domain', input.domain)
    .eq('kind', input.kind)
    .eq('key', input.key)
    .in('status', ['proposed', 'validated'])
    .maybeSingle()
  if (existing?.status === 'validated') return existing.id as string
  const query = existing?.id
    ? supabase.from('agent_memories').update(row).eq('id', existing.id)
    : supabase.from('agent_memories').insert(row)
  const { data, error } = await query.select('id').single()
  if (error || !data) throw new Error(error?.message || 'Mémoire impossible')
  return data.id as string
}

export async function decideAgentMemory(
  supabase: SupabaseClient,
  id: string,
  decision: 'validated' | 'rejected',
  userId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('agent_memories')
    .update({
      status: decision,
      validated_by: userId,
      validated_at: new Date().toISOString(),
      validation_notes: notes?.slice(0, 1000) || null,
    })
    .eq('id', id)
    .eq('status', 'proposed')
  if (error) throw new Error(error.message)
}

export async function createAgentRun(
  supabase: SupabaseClient,
  input: {
    objective: string
    domain: AgentDomain
    plan: AgentPlanStep[]
    triggerType?: AgentRun['trigger_type']
    createdBy?: string
  }
) {
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      objective: input.objective.slice(0, 2000),
      domain: input.domain,
      plan: input.plan,
      trigger_type: input.triggerType ?? 'manual',
      created_by: input.createdBy ?? null,
    })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Mission impossible')
  return data as AgentRun
}

export async function updateAgentRun(
  supabase: SupabaseClient,
  id: string,
  patch: {
    status?: AgentRunStatus
    result?: Record<string, unknown>
    error?: string | null
    model?: string
    promptTokens?: number
    completionTokens?: number
  }
) {
  const status = patch.status
  const { error } = await supabase
    .from('agent_runs')
    .update({
      ...(status ? { status } : {}),
      ...(patch.result ? { result: patch.result } : {}),
      ...(patch.error !== undefined ? { error: patch.error } : {}),
      ...(patch.model ? { model: patch.model } : {}),
      ...(patch.promptTokens != null ? { prompt_tokens: patch.promptTokens } : {}),
      ...(patch.completionTokens != null ? { completion_tokens: patch.completionTokens } : {}),
      ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
      ...(['done', 'error', 'cancelled'].includes(status ?? '')
        ? { finished_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createAgentTasks(
  supabase: SupabaseClient,
  runId: string,
  steps: AgentPlanStep[],
  input: Record<string, unknown>
) {
  if (!steps.length) return []
  const { data, error } = await supabase
    .from('agent_tasks')
    .insert(
      steps.map(step => ({
        run_id: runId,
        assigned_agent: step.agent,
        kind: step.task,
        input,
      }))
    )
    .select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as AgentTask[]
}

export async function addAgentEvent(
  supabase: SupabaseClient,
  input: {
    runId: string
    taskId?: string
    sourceAgent: string
    targetAgent?: string
    type:
      | 'planned'
      | 'delegated'
      | 'tool_call'
      | 'tool_result'
      | 'message'
      | 'memory'
      | 'approval'
      | 'completed'
      | 'failed'
    summary: string
    payload?: Record<string, unknown>
  }
) {
  const { error } = await supabase.from('agent_events').insert({
    run_id: input.runId,
    task_id: input.taskId ?? null,
    source_agent: input.sourceAgent,
    target_agent: input.targetAgent ?? null,
    event_type: input.type,
    summary: input.summary.slice(0, 1000),
    payload: input.payload ?? {},
  })
  if (error) throw new Error(error.message)
}

export async function decideAgentApproval(
  supabase: SupabaseClient,
  id: string,
  decision: 'approved' | 'rejected',
  userId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('agent_approvals')
    .update({
      status: decision,
      decided_by: userId,
      decided_at: new Date().toISOString(),
      decision_notes: notes?.slice(0, 1000) || null,
    })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
}

export async function agentDashboard(supabase: SupabaseClient): Promise<AgentDashboard> {
  const [runs, tasks, events, memories, approvals] = await Promise.all([
    supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(40),
    supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('agent_events').select('*').order('created_at', { ascending: false }).limit(120),
    supabase.from('agent_memories').select('*').order('updated_at', { ascending: false }).limit(80),
    supabase.from('agent_approvals').select('*').order('created_at', { ascending: false }).limit(40),
  ])
  const firstError = runs.error || tasks.error || events.error || memories.error || approvals.error
  if (firstError) throw new Error(firstError.message)
  return {
    runs: (runs.data ?? []) as AgentRun[],
    tasks: (tasks.data ?? []) as AgentTask[],
    events: (events.data ?? []) as AgentEvent[],
    memories: (memories.data ?? []) as AgentMemory[],
    approvals: (approvals.data ?? []) as AgentApproval[],
  }
}
