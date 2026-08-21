import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type Client = SupabaseClient
type Storage = 'seo_research_runs' | 'seo_generation_runs'

export type StoredResearchRun = {
  id: string
  status: 'pending' | 'done' | 'error'
  output: unknown
  error: string | null
  storage: Storage
}

function missingRelation(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        error.code === 'PGRST205' ||
        /seo_research_runs|schema cache|does not exist/i.test(error.message || ''))
  )
}

export async function insertResearchRun(
  supabase: Client,
  input: unknown,
  createdBy: string
): Promise<{ id: string; storage: Storage }> {
  const dedicated = await supabase
    .from('seo_research_runs')
    .insert({
      status: 'pending',
      model: 'cloudflare-seo-strategist',
      prompt_version: 'samez-research-v1',
      input,
      created_by: createdBy,
    })
    .select('id')
    .single()
  if (dedicated.data?.id) {
    return { id: String(dedicated.data.id), storage: 'seo_research_runs' }
  }
  if (!missingRelation(dedicated.error)) {
    throw new Error(dedicated.error?.message || 'Impossible de démarrer la recherche')
  }

  const fallback = await supabase
    .from('seo_generation_runs')
    .insert({
      model: 'cloudflare-seo-strategist',
      prompt_version: 'samez-research-v1',
      input,
      created_by: createdBy,
    })
    .select('id')
    .single()
  if (fallback.error || !fallback.data?.id) {
    throw new Error(fallback.error?.message || 'Impossible de démarrer la recherche')
  }
  return { id: String(fallback.data.id), storage: 'seo_generation_runs' }
}

export async function getResearchRun(supabase: Client, id: string): Promise<StoredResearchRun | null> {
  const dedicated = await supabase
    .from('seo_research_runs')
    .select('id, status, output, error')
    .eq('id', id)
    .maybeSingle()
  if (dedicated.data) {
    return {
      id: String(dedicated.data.id),
      status: dedicated.data.status as StoredResearchRun['status'],
      output: dedicated.data.output,
      error: dedicated.data.error as string | null,
      storage: 'seo_research_runs',
    }
  }
  if (dedicated.error && !missingRelation(dedicated.error)) {
    throw new Error(dedicated.error.message)
  }

  const fallback = await supabase
    .from('seo_generation_runs')
    .select('id, output, error')
    .eq('id', id)
    .eq('prompt_version', 'samez-research-v1')
    .maybeSingle()
  if (fallback.error) throw new Error(fallback.error.message)
  if (!fallback.data) return null
  return {
    id: String(fallback.data.id),
    status: fallback.data.output ? 'done' : fallback.data.error ? 'error' : 'pending',
    output: fallback.data.output,
    error: fallback.data.error as string | null,
    storage: 'seo_generation_runs',
  }
}

export async function updateResearchRun(
  supabase: Client,
  id: string,
  storage: Storage,
  values: {
    status: 'pending' | 'done' | 'error'
    output?: unknown
    error?: string | null
    model?: string
    prompt_tokens?: number
    completion_tokens?: number
  }
) {
  const payload =
    storage === 'seo_research_runs'
      ? values
      : {
          output: values.output,
          error: values.status === 'error' ? values.error || 'Recherche impossible' : null,
          model: values.model,
          prompt_tokens: values.prompt_tokens,
          completion_tokens: values.completion_tokens,
        }
  const { error } = await supabase.from(storage).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function latestResearchRun(supabase: Client): Promise<StoredResearchRun | null> {
  const dedicated = await supabase
    .from('seo_research_runs')
    .select('id, status, output, error')
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (dedicated.data) {
    return {
      id: String(dedicated.data.id),
      status: 'done',
      output: dedicated.data.output,
      error: null,
      storage: 'seo_research_runs',
    }
  }
  if (dedicated.error && !missingRelation(dedicated.error)) {
    throw new Error(dedicated.error.message)
  }
  const fallback = await supabase
    .from('seo_generation_runs')
    .select('id, output, error')
    .eq('prompt_version', 'samez-research-v1')
    .not('output', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (fallback.error) throw new Error(fallback.error.message)
  if (!fallback.data) return null
  return {
    id: String(fallback.data.id),
    status: 'done',
    output: fallback.data.output,
    error: fallback.data.error as string | null,
    storage: 'seo_generation_runs',
  }
}
