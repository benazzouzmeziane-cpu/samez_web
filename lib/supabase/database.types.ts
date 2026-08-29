export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SeoDocumentRow = {
  id: string
  type: 'service' | 'pillar' | 'guide' | 'case_study'
  slug: string
  silo: string | null
  parent_id: string | null
  is_indexable: boolean
  created_at: string
  updated_at: string
}

export type SeoDocumentVersionRow = {
  id: string
  document_id: string
  version_number: number
  status: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived'
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
  search_intent: 'informational' | 'commercial' | 'transactional' | 'navigational' | null
  audience: string | null
  entities: Json
  factual_summary: string | null
  geo_locality: string | null
  geo_region: string | null
  blocks: Json
  faq: Json
  sources: Json
  extra_json_ld: Json | null
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

export type SeoInternalLinkRow = {
  id: string
  source_version_id: string
  target_document_id: string
  anchor_text: string
  rel: string | null
  approved: boolean
  order_index: number
  created_at: string
}

export type SeoRedirectRow = {
  id: string
  from_path: string
  to_path: string
  created_at: string
}

export type SeoGenerationRunRow = {
  id: string
  document_id: string | null
  version_id: string | null
  model: string
  prompt_version: string
  input: Json
  output: Json | null
  error: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  created_by: string | null
  created_at: string
}

export type SeoResearchRunRow = {
  id: string
  status: 'pending' | 'done' | 'error'
  model: string
  prompt_version: string
  input: Json
  output: Json | null
  error: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SeoMediaRow = {
  id: string
  path: string
  public_url: string
  alt: string
  width: number | null
  height: number | null
  created_by: string | null
  created_at: string
}

export type SeoProofRow = {
  id: string
  slug: string
  client_name: string
  title: string
  summary: string
  deliverables: string[]
  tags: string[]
  url: string | null
  is_verified: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type SeoGscPageMetricRow = {
  id: string
  page_path: string
  period_start: string
  period_end: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  synced_at: string
}

export type SeoGscQueryMetricRow = {
  id: string
  query: string
  page_path: string | null
  period_start: string
  period_end: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  synced_at: string
}

type Table<Row, Insert = Partial<Row> & Record<string, never>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      seo_documents: Table<
        SeoDocumentRow,
        Omit<SeoDocumentRow, 'id' | 'created_at' | 'updated_at' | 'is_indexable'> & {
          id?: string
          is_indexable?: boolean
          created_at?: string
          updated_at?: string
        }
      >
      seo_document_versions: Table<
        SeoDocumentVersionRow,
        Partial<SeoDocumentVersionRow> & {
          document_id: string
          version_number: number
          title: string
        }
      >
      seo_internal_links: Table<
        SeoInternalLinkRow,
        Omit<SeoInternalLinkRow, 'id' | 'created_at' | 'approved' | 'order_index' | 'rel'> & {
          id?: string
          approved?: boolean
          order_index?: number
          rel?: string | null
          created_at?: string
        }
      >
      seo_redirects: Table<
        SeoRedirectRow,
        Omit<SeoRedirectRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
      >
      seo_generation_runs: Table<
        SeoGenerationRunRow,
        Partial<SeoGenerationRunRow> & { model: string; prompt_version: string }
      >
      seo_research_runs: Table<
        SeoResearchRunRow,
        Partial<SeoResearchRunRow> & {
          model: string
          prompt_version: string
          input: Json
        }
      >
      seo_media: Table<
        SeoMediaRow,
        Omit<SeoMediaRow, 'id' | 'created_at' | 'width' | 'height' | 'created_by'> & {
          id?: string
          width?: number | null
          height?: number | null
          created_by?: string | null
          created_at?: string
        }
      >
      seo_proofs: Table<
        SeoProofRow,
        Omit<SeoProofRow, 'id' | 'created_at' | 'updated_at' | 'is_verified' | 'sort_order' | 'deliverables' | 'tags'> & {
          id?: string
          is_verified?: boolean
          sort_order?: number
          deliverables?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      >
      seo_gsc_page_metrics: Table<
        SeoGscPageMetricRow,
        Omit<SeoGscPageMetricRow, 'id' | 'synced_at'> & {
          id?: string
          synced_at?: string
        }
      >
      seo_gsc_query_metrics: Table<
        SeoGscQueryMetricRow,
        Omit<SeoGscQueryMetricRow, 'id' | 'synced_at'> & {
          id?: string
          synced_at?: string
        }
      >
    }
    Views: Record<string, never>
    Functions: {
      publish_seo_version: {
        Args: { p_version_id: string }
        Returns: string
      }
      is_seo_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      agent_convert_radar_item: {
        Args: { p_item_id: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
