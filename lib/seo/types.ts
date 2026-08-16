import type {
  ContentBlock,
  DocumentType,
  EntityItem,
  FaqItem,
  SourceItem,
  VersionStatus,
} from './schema'

export type SeoDocument = {
  id: string
  type: DocumentType
  slug: string
  silo: string | null
  parent_id: string | null
  is_indexable: boolean
  created_at: string
  updated_at: string
}

export type SeoDocumentVersion = {
  id: string
  document_id: string
  version_number: number
  status: VersionStatus
  title: string
  h1: string | null
  excerpt: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_path: string | null
  og_image_url: string | null
  og_title: string | null
  og_description: string | null
  robots_index: boolean
  robots_follow: boolean
  keyword_primary: string | null
  search_intent: string | null
  audience: string | null
  entities: EntityItem[]
  factual_summary: string | null
  geo_locality: string | null
  geo_region: string | null
  blocks: ContentBlock[]
  faq: FaqItem[]
  sources: SourceItem[]
  extra_json_ld: Record<string, unknown> | null
  target_slug: string | null
  cta_label: string | null
  cta_href: string | null
  author_name: string
  ai_generated: boolean
  human_reviewed: boolean
  review_notes: string | null
  publish_at: string | null
  published_at: string | null
  created_by: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export type SeoDocumentWithVersion = SeoDocument & {
  version: SeoDocumentVersion
  path: string
}

export type SeoInternalLink = {
  id: string
  source_version_id: string
  target_document_id: string
  anchor_text: string
  rel: string | null
  approved: boolean
  order_index: number
}

export type SeoRedirect = {
  id: string
  from_path: string
  to_path: string
  created_at: string
}

export type ChecklistItem = {
  id: string
  label: string
  ok: boolean
  blocking: boolean
}
