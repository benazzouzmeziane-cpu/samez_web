import type { SupabaseClient } from '@supabase/supabase-js'
import { contentBlockSchema, faqItemSchema, sourceItemSchema } from './schema'
import { documentPath } from './paths'
import type { SeoDocument, SeoDocumentVersion, SeoDocumentWithVersion } from './types'
import type { ContentBlock, DocumentType, FaqItem, SourceItem } from './schema'

type AnyClient = SupabaseClient

function asArray<T>(value: unknown, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return []
  return value.map(parse).filter((item): item is T => item !== null)
}

function parseBlock(value: unknown): ContentBlock | null {
  const parsed = contentBlockSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function parseFaq(value: unknown): FaqItem | null {
  const parsed = faqItemSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function parseSource(value: unknown): SourceItem | null {
  const parsed = sourceItemSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function mapVersion(row: Record<string, unknown>): SeoDocumentVersion {
  return {
    id: String(row.id),
    document_id: String(row.document_id),
    version_number: Number(row.version_number),
    status: row.status as SeoDocumentVersion['status'],
    title: String(row.title ?? ''),
    h1: (row.h1 as string | null) ?? null,
    excerpt: (row.excerpt as string | null) ?? null,
    meta_title: (row.meta_title as string | null) ?? null,
    meta_description: (row.meta_description as string | null) ?? null,
    canonical_path: (row.canonical_path as string | null) ?? null,
    og_image_url: (row.og_image_url as string | null) ?? null,
    og_title: (row.og_title as string | null) ?? null,
    og_description: (row.og_description as string | null) ?? null,
    robots_index: Boolean(row.robots_index ?? true),
    robots_follow: Boolean(row.robots_follow ?? true),
    keyword_primary: (row.keyword_primary as string | null) ?? null,
    search_intent: (row.search_intent as string | null) ?? null,
    audience: (row.audience as string | null) ?? null,
    entities: Array.isArray(row.entities) ? (row.entities as SeoDocumentVersion['entities']) : [],
    factual_summary: (row.factual_summary as string | null) ?? null,
    geo_locality: (row.geo_locality as string | null) ?? null,
    geo_region: (row.geo_region as string | null) ?? 'FR',
    blocks: asArray(row.blocks, parseBlock),
    faq: asArray(row.faq, parseFaq),
    sources: asArray(row.sources, parseSource),
    extra_json_ld: (row.extra_json_ld as Record<string, unknown> | null) ?? null,
    target_slug: (row.target_slug as string | null) ?? null,
    cta_label: (row.cta_label as string | null) ?? null,
    cta_href: (row.cta_href as string | null) ?? null,
    author_name: String(row.author_name ?? "same'z"),
    ai_generated: Boolean(row.ai_generated),
    human_reviewed: Boolean(row.human_reviewed),
    review_notes: (row.review_notes as string | null) ?? null,
    publish_at: (row.publish_at as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function mapDocument(row: Record<string, unknown>): SeoDocument {
  return {
    id: String(row.id),
    type: row.type as DocumentType,
    slug: String(row.slug),
    silo: (row.silo as string | null) ?? null,
    parent_id: (row.parent_id as string | null) ?? null,
    is_indexable: Boolean(row.is_indexable ?? true),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function isLive(version: Pick<SeoDocumentVersion, 'status' | 'publish_at'>): boolean {
  if (version.status === 'published') return true
  if (version.status === 'scheduled' && version.publish_at) {
    return new Date(version.publish_at).getTime() <= Date.now()
  }
  return false
}

export function withPath(document: SeoDocument, version: SeoDocumentVersion): SeoDocumentWithVersion {
  return {
    ...document,
    version,
    path: version.canonical_path || documentPath(document.type, document.slug),
  }
}

export async function listDocuments(supabase: AnyClient) {
  const { data, error } = await supabase
    .from('seo_documents')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapDocument(row as Record<string, unknown>))
}

export async function listDocumentVersions(supabase: AnyClient, documentId: string) {
  const { data, error } = await supabase
    .from('seo_document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapVersion(row as Record<string, unknown>))
}

export async function getDocument(supabase: AnyClient, id: string) {
  const { data, error } = await supabase.from('seo_documents').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapDocument(data as Record<string, unknown>) : null
}

export async function getVersion(supabase: AnyClient, id: string) {
  const { data, error } = await supabase
    .from('seo_document_versions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapVersion(data as Record<string, unknown>) : null
}

export async function getWorkingBundle(supabase: AnyClient, documentId: string) {
  const document = await getDocument(supabase, documentId)
  if (!document) return null
  const versions = await listDocumentVersions(supabase, documentId)
  const working =
    versions.find(v => v.status === 'draft' || v.status === 'in_review' || v.status === 'scheduled') ??
    versions.find(v => v.status === 'published') ??
    versions[0]
  if (!working) return null
  return { document, version: working, versions, path: documentPath(document.type, document.slug) }
}

export async function getLiveBySlug(
  supabase: AnyClient,
  type: DocumentType,
  slug: string
): Promise<SeoDocumentWithVersion | null> {
  const { data: documentRow, error } = await supabase
    .from('seo_documents')
    .select('*')
    .eq('type', type)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!documentRow) return null
  const document = mapDocument(documentRow as Record<string, unknown>)
  const { data: versionRows, error: versionError } = await supabase
    .from('seo_document_versions')
    .select('*')
    .eq('document_id', document.id)
    .in('status', ['published', 'scheduled'])
    .order('version_number', { ascending: false })
  if (versionError) throw new Error(versionError.message)
  const versions = (versionRows ?? [])
    .map(row => mapVersion(row as Record<string, unknown>))
  const live =
    versions.find(v => v.status === 'scheduled' && isLive(v)) ??
    versions.find(v => v.status === 'published')
  if (!live) return null
  return withPath(document, live)
}

export async function listLiveDocuments(supabase: AnyClient): Promise<SeoDocumentWithVersion[]> {
  const { data, error } = await supabase
    .from('seo_documents')
    .select('*, seo_document_versions(*)')
    .eq('is_indexable', true)
  if (error) {
    const fallback = await supabase.from('seo_documents').select('*').eq('is_indexable', true)
    if (fallback.error) throw new Error(fallback.error.message)
    const result: SeoDocumentWithVersion[] = []
    for (const row of fallback.data ?? []) {
      const document = mapDocument(row as Record<string, unknown>)
      const live = await getLiveBySlug(supabase, document.type, document.slug)
      if (live) result.push(live)
    }
    return result.sort(
      (a, b) =>
        new Date(b.version.updated_at).getTime() - new Date(a.version.updated_at).getTime()
    )
  }
  const result: SeoDocumentWithVersion[] = []
  for (const row of data ?? []) {
    const record = row as Record<string, unknown>
    const document = mapDocument(record)
    const versions = Array.isArray(record.seo_document_versions)
      ? (record.seo_document_versions as Record<string, unknown>[]).map(mapVersion)
      : []
    const live =
      versions.find(v => v.status === 'scheduled' && isLive(v)) ??
      versions.find(v => v.status === 'published')
    if (!live || !document.is_indexable || !live.robots_index) continue
    result.push(withPath(document, live))
  }
  return result.sort(
    (a, b) =>
      new Date(b.version.updated_at).getTime() - new Date(a.version.updated_at).getTime()
  )
}

export async function getRedirect(supabase: AnyClient, fromPath: string) {
  const { data, error } = await supabase
    .from('seo_redirects')
    .select('*')
    .eq('from_path', fromPath)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as { from_path: string; to_path: string } | null
}

export async function listInternalLinks(supabase: AnyClient, versionId: string) {
  const { data, error } = await supabase
    .from('seo_internal_links')
    .select('*')
    .eq('source_version_id', versionId)
    .order('order_index', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listApprovedLinksForVersion(supabase: AnyClient, versionId: string) {
  const { data, error } = await supabase
    .from('seo_internal_links')
    .select('*, seo_documents!seo_internal_links_target_document_id_fkey(*)')
    .eq('source_version_id', versionId)
    .eq('approved', true)
    .order('order_index', { ascending: true })
  if (error) {
    const fallback = await supabase
      .from('seo_internal_links')
      .select('*')
      .eq('source_version_id', versionId)
      .eq('approved', true)
      .order('order_index', { ascending: true })
    if (fallback.error) throw new Error(fallback.error.message)
    return fallback.data ?? []
  }
  return data ?? []
}

export async function listIncomingLinks(supabase: AnyClient, documentId: string) {
  const { data, error } = await supabase
    .from('seo_internal_links')
    .select('anchor_text, source_version_id, approved')
    .eq('target_document_id', documentId)
    .eq('approved', true)
  if (error) throw new Error(error.message)
  const rows = data ?? []
  const result: { anchor: string; slug: string }[] = []
  for (const row of rows) {
    const version = await getVersion(supabase, String(row.source_version_id))
    if (!version || !isLive(version)) continue
    const source = await getDocument(supabase, version.document_id)
    if (source) result.push({ anchor: String(row.anchor_text), slug: source.slug })
  }
  return result
}

export async function nextVersionNumber(supabase: AnyClient, documentId: string) {
  const { data, error } = await supabase
    .from('seo_document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.version_number ?? 0) + 1
}
