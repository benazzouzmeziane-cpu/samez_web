import { createSeoReadClient, createServiceClient } from '@/lib/supabase/server'
import { SAMEZ_VERIFIED_PROOFS } from './research-schema'

export type SeoProof = {
  id: string
  slug: string
  clientName: string
  title: string
  summary: string
  deliverables: string[]
  tags: string[]
  url: string | null
  isVerified: boolean
}

const FALLBACK_PROOFS: SeoProof[] = SAMEZ_VERIFIED_PROOFS.map((line, index) => {
  const [clientName, summary] = line.split(':').map(part => part.trim())
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return {
    id: `fallback-${slug}`,
    slug,
    clientName,
    title: clientName,
    summary: summary || line,
    deliverables: [],
    tags: [],
    url: null,
    isVerified: true,
  }
})

function mapProof(row: Record<string, unknown>): SeoProof {
  return {
    id: String(row.id),
    slug: String(row.slug),
    clientName: String(row.client_name),
    title: String(row.title),
    summary: String(row.summary),
    deliverables: Array.isArray(row.deliverables) ? row.deliverables.map(String) : [],
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    url: (row.url as string | null) ?? null,
    isVerified: Boolean(row.is_verified ?? true),
  }
}

export async function listSeoProofs(): Promise<SeoProof[]> {
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : createSeoReadClient()
  const { data, error } = await client
    .from('seo_proofs')
    .select('*')
    .eq('is_verified', true)
    .order('sort_order', { ascending: true })

  if (error || !data?.length) return FALLBACK_PROOFS
  return data.map(row => mapProof(row as Record<string, unknown>))
}

export function formatProofsForPrompt(proofs: SeoProof[]): string {
  return proofs
    .map(proof => {
      const deliverables = proof.deliverables.length ? ` (${proof.deliverables.join(', ')})` : ''
      return `${proof.clientName} : ${proof.summary}${deliverables}`
    })
    .join('\n')
}

export async function verifiedProofsText(): Promise<string> {
  const proofs = await listSeoProofs()
  return formatProofsForPrompt(proofs)
}
