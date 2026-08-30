import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendClientFollowUpEmail } from '@/lib/email'
import { autoPublishSeoVersion } from '@/lib/agents/auto-publish'
import { addAgentEvent } from '@/lib/agents/store'

const uuid = z.string().uuid()
const stage = z.enum(['prospect', 'qualifié', 'proposition', 'client', 'inactif'])
const internalPath = z.string().regex(/^\/(?!\/)[^\s?#]*$/, 'Chemin interne invalide')

const actionSchema = z.object({
  rank: z.number().int().min(1).max(3),
  actionType: z.enum([
    'analysis',
    'publish_seo',
    'send_email',
    'convert_crm',
    'change_stage',
    'redirect',
    'external_write',
  ]),
  title: z.string().trim().min(3).max(160),
  target: z.string().trim().min(1).max(500),
  rationale: z.string().trim().min(10).max(2000),
  deadline: z.string(),
  metric: z.string().trim().min(2).max(500),
  expectedImpact: z.string().trim().min(2).max(1000),
  evidence: z.array(z.object({ source: z.string(), reference: z.string(), fact: z.string() })).min(1),
  requiresApproval: z.boolean(),
  execution: z.object({
    versionId: z.string(),
    clientId: z.string(),
    radarItemId: z.string(),
    subject: z.string(),
    body: z.string(),
    stage: z.string(),
    fromPath: z.string(),
    toPath: z.string(),
  }),
})

type Action = z.infer<typeof actionSchema>

type ApprovalRow = {
  id: string
  run_id: string
  action_type: string
  status: string
  payload: Record<string, unknown>
  execution_result: Record<string, unknown> | null
  execution_attempts: number
}

export async function executeAgentApproval(supabase: SupabaseClient, id: string) {
  const { data: current, error: currentError } = await supabase
    .from('agent_approvals')
    .select('*')
    .eq('id', id)
    .single()
  if (currentError || !current) throw new Error(currentError?.message || 'Approbation introuvable')
  const existing = current as ApprovalRow
  if (existing.status === 'executed') return existing.execution_result ?? { alreadyExecuted: true }
  if (existing.status === 'executing') throw new Error('Cette action est déjà en cours d’exécution')
  if (!['approved', 'failed'].includes(existing.status)) {
    throw new Error('Cette action doit être approuvée avant son exécution')
  }
  if (existing.execution_attempts >= 3) {
    throw new Error('Nombre maximal de tentatives atteint')
  }

  const now = new Date().toISOString()
  const { data: claimed, error: claimError } = await supabase
    .from('agent_approvals')
    .update({
      status: 'executing',
      execution_started_at: now,
      executed_at: null,
      execution_error: null,
      execution_attempts: existing.execution_attempts + 1,
    })
    .eq('id', id)
    .eq('status', existing.status)
    .eq('execution_attempts', existing.execution_attempts)
    .select('*')
    .maybeSingle()
  if (claimError) throw new Error(claimError.message)
  if (!claimed) throw new Error('Cette action vient d’être réclamée par une autre exécution')

  const approval = claimed as ApprovalRow
  try {
    const action = await hydrateAction(supabase, approval)
    await supabase
      .from('agent_approvals')
      .update({ payload: { ...approval.payload, action } })
      .eq('id', id)
      .eq('status', 'executing')
    await addAgentEvent(supabase, {
      runId: approval.run_id,
      sourceAgent: 'samez-orchestrator',
      type: 'approval',
      summary: `Exécution démarrée : ${action.title}`,
      payload: {
        approvalId: id,
        phase: 'executing',
        actionType: action.actionType,
        attempt: approval.execution_attempts,
      },
    })
    const result = await dispatch(supabase, approval, action)
    const { error } = await supabase
      .from('agent_approvals')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        execution_result: result,
        execution_error: null,
      })
      .eq('id', id)
      .eq('status', 'executing')
    if (error) throw new Error(error.message)
    await addAgentEvent(supabase, {
      runId: approval.run_id,
      sourceAgent: 'samez-orchestrator',
      type: 'approval',
      summary: `Action exécutée : ${action.title}`,
      payload: { approvalId: id, phase: 'executed', actionType: action.actionType, result },
    })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Exécution impossible'
    await supabase
      .from('agent_approvals')
      .update({
        status: 'failed',
        executed_at: new Date().toISOString(),
        execution_error: message.slice(0, 2000),
      })
      .eq('id', id)
      .eq('status', 'executing')
    await addAgentEvent(supabase, {
      runId: approval.run_id,
      sourceAgent: 'samez-orchestrator',
      type: 'approval',
      summary: `Échec d’exécution : ${message}`,
      payload: { approvalId: id, phase: 'failed', actionType: approval.action_type },
    }).catch(() => undefined)
    throw new Error(message)
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function evidenceList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => asRecord(item))
    .map(item => ({
      source: text(item.source),
      reference: text(item.reference),
      fact: text(item.fact) || text(item.reference),
    }))
    .filter(item => item.source && item.reference)
}

function emptyExecution() {
  return {
    versionId: '',
    clientId: '',
    radarItemId: '',
    subject: '',
    body: '',
    stage: '',
    fromPath: '',
    toPath: '',
  }
}

function emailDraft(name: string) {
  const safeName = name.trim() || 'ce contact'
  return {
    subject: `Point d’avancement — ${safeName}`.slice(0, 120),
    body: [
      `Bonjour ${safeName},`,
      '',
      'Je reviens vers vous au sujet de votre projet. same’z peut vous aider à cadrer le besoin, livrer un outil adapté et suivre la mise en production.',
      'Dites-moi si un échange court cette semaine vous convient.',
      '',
      'Bien cordialement,',
      'same’z',
    ].join('\n'),
  }
}

async function hydrateAction(supabase: SupabaseClient, approval: ApprovalRow): Promise<Action> {
  const payload = asRecord(approval.payload)
  const raw = { ...asRecord(payload.action), ...payload }
  const execution = { ...emptyExecution(), ...asRecord(raw.execution) }
  const evidence = evidenceList(raw.evidence)
  const actionType = text(raw.actionType) || approval.action_type
  const target = text(raw.target) || text(raw.title) || 'Cible à préciser'
  const title = text(raw.title) || approval.action_type

  if (actionType === 'publish_seo') {
    const fromEvidence = evidence.find(item => item.source === 'seo.candidateVersions')?.reference
    execution.versionId =
      text(execution.versionId) || text(raw.versionId) || text(payload.versionId) || fromEvidence || ''
    if (!uuid.safeParse(execution.versionId).success) {
      const { data } = await supabase
        .from('seo_document_versions')
        .select('id, title, status, ai_generated, sources')
        .in('status', ['in_review', 'draft', 'scheduled'])
        .order('updated_at', { ascending: false })
        .limit(20)
      const match = (data ?? []).find(version => {
        const label = `${version.title ?? ''}`.toLowerCase()
        return (
          version.status === 'in_review' &&
          version.ai_generated === true &&
          Array.isArray(version.sources) &&
          version.sources.length > 0 &&
          (label.includes(target.toLowerCase().slice(0, 24)) ||
            title.toLowerCase().includes(label.slice(0, 24)))
        )
      })
      if (match) execution.versionId = match.id
    }
  }

  if (actionType === 'send_email' || actionType === 'change_stage') {
    const fromEvidence = evidence.find(item => item.source === 'crm.clients')?.reference
    execution.clientId =
      text(execution.clientId) || text(raw.clientId) || text(payload.clientId) || fromEvidence || ''
    if (!uuid.safeParse(execution.clientId).success) {
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .order('updated_at', { ascending: false })
        .limit(40)
      const needle = target.toLowerCase()
      const match = (data ?? []).find(client => {
        const haystack = `${client.name ?? ''} ${client.company ?? ''}`.toLowerCase()
        return needle.length >= 4 && haystack.includes(needle.slice(0, 40))
      })
      if (match) execution.clientId = match.id
    }
    if (actionType === 'send_email') {
      const { data: client } = uuid.safeParse(execution.clientId).success
        ? await supabase.from('clients').select('name, email').eq('id', execution.clientId).maybeSingle()
        : { data: null }
      if (!client?.email) throw new Error('Email vérifié absent de la fiche CRM')
      const draft = emailDraft(client.name || target)
      execution.subject = text(execution.subject) || text(raw.subject) || draft.subject
      execution.body = text(execution.body) || text(raw.body) || draft.body
    }
    if (actionType === 'change_stage') {
      execution.stage = text(execution.stage) || text(raw.stage) || 'qualifié'
    }
  }

  if (actionType === 'convert_crm') {
    execution.radarItemId =
      text(execution.radarItemId) ||
      text(raw.radarItemId) ||
      evidence.find(item => item.source === 'radar.items')?.reference ||
      ''
  }

  if (actionType === 'redirect') {
    execution.fromPath = text(execution.fromPath) || text(raw.fromPath)
    execution.toPath = text(execution.toPath) || text(raw.toPath)
  }

  const parsed = actionSchema.safeParse({
    rank: Number(raw.rank) || 1,
    actionType,
    title: title.slice(0, 160),
    target: target.slice(0, 500),
    rationale: (text(raw.rationale) || text(payload.summary) || title).slice(0, 2000),
    deadline: text(raw.deadline) || new Date().toISOString().slice(0, 10),
    metric: (text(raw.metric) || 'exécution validée').slice(0, 500),
    expectedImpact: (text(raw.expectedImpact) || 'Action approuvée par un administrateur').slice(0, 1000),
    evidence: evidence.length
      ? evidence
      : [{ source: 'crm.clients', reference: execution.clientId || 'collection', fact: target }],
    requiresApproval: true,
    execution,
  })
  if (!parsed.success) {
    throw new Error('Impossible de reconstruire un payload exécutable pour cette approbation')
  }
  if (parsed.data.actionType !== approval.action_type) {
    throw new Error('Le type de l’action ne correspond pas à son approbation')
  }
  if (parsed.data.actionType === 'analysis') throw new Error('Une analyse interne ne nécessite pas d’exécution')
  return parsed.data
}

async function dispatch(supabase: SupabaseClient, approval: ApprovalRow, action: Action) {
  if (action.actionType === 'publish_seo') return publishSeo(supabase, approval, action)
  if (action.actionType === 'send_email') return sendEmail(supabase, approval, action)
  if (action.actionType === 'convert_crm') return convertRadar(supabase, action)
  if (action.actionType === 'change_stage') return changeClientStage(supabase, action)
  if (action.actionType === 'redirect') return createSeoRedirect(supabase, action)
  throw new Error('Écriture externe générique non autorisée')
}

async function publishSeo(supabase: SupabaseClient, approval: ApprovalRow, action: Action) {
  const versionId = uuid.parse(action.execution.versionId)
  const { data: version, error } = await supabase
    .from('seo_document_versions')
    .select('status, document_id')
    .eq('id', versionId)
    .single()
  if (error || !version) throw new Error(error?.message || 'Version SEO introuvable')
  if (version.status === 'published') {
    return { versionId, documentId: version.document_id, alreadyPublished: true }
  }
  return autoPublishSeoVersion(supabase, versionId, approval.run_id)
}

async function sendEmail(supabase: SupabaseClient, approval: ApprovalRow, action: Action) {
  const clientId = uuid.parse(action.execution.clientId)
  const subject = action.execution.subject.replace(/[\r\n]/g, ' ').trim().slice(0, 120)
  const body = action.execution.body.trim().slice(0, 3000)
  if (subject.length < 5 || body.length < 80) throw new Error('Brouillon email incomplet')
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('id', clientId)
    .single()
  if (error || !client) throw new Error(error?.message || 'Client CRM introuvable')
  if (!client.email) throw new Error('Email vérifié absent de la fiche CRM')

  const sent = await sendClientFollowUpEmail({
    name: client.name,
    email: client.email,
    subject,
    body,
    messageId: `<agent-approval-${approval.id}@samez.fr>`,
  })
  const { error: activityError } = await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'email',
    title: subject,
    body,
    status: 'faite',
    done_at: new Date().toISOString(),
  })
  await supabase
    .from('clients')
    .update({ last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', clientId)
  return {
    clientId,
    messageId: sent.messageId,
    activityRecorded: !activityError,
  }
}

async function convertRadar(supabase: SupabaseClient, action: Action) {
  const radarItemId = uuid.parse(action.execution.radarItemId)
  const { data, error } = await supabase.rpc('agent_convert_radar_item', { p_item_id: radarItemId })
  if (error || !data) throw new Error(error?.message || 'Conversion CRM impossible')
  return { radarItemId, clientId: String(data) }
}

async function changeClientStage(supabase: SupabaseClient, action: Action) {
  const clientId = uuid.parse(action.execution.clientId)
  const nextStage = stage.parse(action.execution.stage)
  const { data: client, error } = await supabase
    .from('clients')
    .select('stage')
    .eq('id', clientId)
    .single()
  if (error || !client) throw new Error(error?.message || 'Client CRM introuvable')
  if (client.stage === nextStage) return { clientId, stage: nextStage, unchanged: true }
  const { error: updateError } = await supabase
    .from('clients')
    .update({ stage: nextStage, updated_at: new Date().toISOString() })
    .eq('id', clientId)
  if (updateError) throw new Error(updateError.message)
  await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'statut',
    title: `${client.stage} → ${nextStage}`,
    status: 'faite',
    done_at: new Date().toISOString(),
  })
  return { clientId, previousStage: client.stage, stage: nextStage }
}

async function createSeoRedirect(supabase: SupabaseClient, action: Action) {
  const fromPath = internalPath.parse(action.execution.fromPath)
  const toPath = internalPath.parse(action.execution.toPath)
  if (fromPath === toPath) throw new Error('Une redirection doit changer de chemin')
  const { data, error } = await supabase
    .from('seo_redirects')
    .upsert({ from_path: fromPath, to_path: toPath }, { onConflict: 'from_path' })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Redirection impossible')
  return { redirectId: data.id, fromPath, toPath }
}
