export const AGENT_DOMAINS = ['global', 'radar', 'seo', 'crm', 'analytics'] as const
export type AgentDomain = (typeof AGENT_DOMAINS)[number]

export const AGENT_NAMES = [
  'samez-orchestrator',
  'seo-strategist',
  'seo-writer',
  'radar-agent',
  'crm-agent',
  'analyst-agent',
  'critic-agent',
] as const
export type AgentName = (typeof AGENT_NAMES)[number]

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'done'
  | 'error'
  | 'cancelled'

export type AgentMemory = {
  id: string
  domain: AgentDomain
  kind: 'fact' | 'preference' | 'decision' | 'experience' | 'metric'
  key: string
  title: string
  content: string
  payload: Record<string, unknown>
  source_type: 'agent' | 'human' | 'system' | 'import'
  source_agent: string | null
  source_ref_type: string | null
  source_ref_id: string | null
  status: 'proposed' | 'validated' | 'rejected' | 'superseded'
  confidence: number | null
  validation_notes: string | null
  validated_at: string | null
  expires_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type AgentRun = {
  id: string
  objective: string
  domain: AgentDomain
  status: AgentRunStatus
  trigger_type: 'manual' | 'schedule' | 'event' | 'agent'
  orchestrator: string
  plan: AgentPlanStep[]
  result: Record<string, unknown> | null
  error: string | null
  model: string | null
  prompt_tokens: number
  completion_tokens: number
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export type AgentPlanStep = {
  agent: AgentName
  task: string
  dependsOn?: number[]
  approval?: boolean
}

export type AgentTask = {
  id: string
  run_id: string
  parent_task_id: string | null
  assigned_agent: AgentName
  kind: string
  status: AgentRunStatus
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  attempts: number
  max_attempts: number
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export type AgentApproval = {
  id: string
  run_id: string
  task_id: string | null
  action_type: 'publish_seo' | 'send_email' | 'convert_crm' | 'change_stage' | 'redirect' | 'external_write'
  risk: 'low' | 'medium' | 'high'
  title: string
  summary: string
  payload: Record<string, unknown>
  status: 'pending' | 'approved' | 'executing' | 'rejected' | 'expired' | 'executed' | 'failed'
  decision_notes: string | null
  execution_started_at: string | null
  executed_at: string | null
  execution_result: Record<string, unknown> | null
  execution_error: string | null
  execution_attempts: number
  idempotency_key: string | null
  created_at: string
  updated_at: string
}

export type AgentEvent = {
  id: number
  run_id: string
  task_id: string | null
  source_agent: string
  target_agent: string | null
  event_type:
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
  payload: Record<string, unknown>
  created_at: string
}

export type AgentDashboard = {
  runs: AgentRun[]
  tasks: AgentTask[]
  events: AgentEvent[]
  memories: AgentMemory[]
  approvals: AgentApproval[]
}
