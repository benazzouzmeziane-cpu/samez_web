'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import {
  createDocumentSchema,
  internalLinkInputSchema,
  versionInputSchema,
  type VersionInput,
} from './schema'
import { documentPath } from './paths'
import { revalidateSeo } from './cache'
import { getDocument, getVersion, listDocumentVersions, nextVersionNumber } from './queries'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) {
    throw new Error('Accès admin requis')
  }
  return { supabase, user }
}

function readParseError(error: { issues?: { message?: string }[] }) {
  return error.issues?.[0]?.message || 'Données invalides'
}

function versionRow(input: VersionInput, extras: Record<string, unknown>) {
  return {
    title: input.title,
    h1: input.h1 || input.title,
    excerpt: input.excerpt || null,
    meta_title: input.metaTitle,
    meta_description: input.metaDescription,
    canonical_path: input.canonicalPath || null,
    og_image_url: input.ogImageUrl || null,
    og_title: input.ogTitle || null,
    og_description: input.ogDescription || null,
    robots_index: input.robotsIndex,
    robots_follow: input.robotsFollow,
    keyword_primary: input.keywordPrimary || null,
    search_intent: input.searchIntent || null,
    audience: input.audience || null,
    entities: input.entities,
    factual_summary: input.factualSummary || null,
    geo_locality: input.geoLocality || null,
    geo_region: input.geoRegion || 'FR',
    blocks: input.blocks,
    faq: input.faq,
    sources: input.sources,
    extra_json_ld: input.extraJsonLd || null,
    target_slug: input.slug,
    cta_label: input.ctaLabel || null,
    cta_href: input.ctaHref || null,
    author_name: input.authorName,
    human_reviewed: input.humanReviewed,
    review_notes: input.reviewNotes || null,
    ...extras,
  }
}

export async function createSeoDocument(raw: unknown) {
  const parsed = createDocumentSchema.safeParse(raw)
  if (!parsed.success) throw new Error(readParseError(parsed.error))
  const input = parsed.data
  const { supabase, user } = await requireAdmin()
  const path = documentPath(input.type, input.slug)

  const { data: document, error } = await supabase
    .from('seo_documents')
    .insert({
      type: input.type,
      slug: input.slug,
      silo: input.silo || null,
      parent_id: input.parentId || null,
    })
    .select('id')
    .single()
  if (error || !document) {
    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('seo_documents')
        .select('id')
        .eq('type', input.type)
        .eq('slug', input.slug)
        .maybeSingle()
      if (existing?.id) {
        const { data: existingVersion } = await supabase
          .from('seo_document_versions')
          .select('id')
          .eq('document_id', existing.id)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (existingVersion?.id) {
          return {
            documentId: existing.id as string,
            versionId: existingVersion.id as string,
          }
        }
      }
    }
    throw new Error(error?.message || 'Création impossible')
  }

  const { data: version, error: versionError } = await supabase
    .from('seo_document_versions')
    .insert({
      document_id: document.id,
      version_number: 1,
      status: 'draft',
      title: input.title,
      h1: input.title,
      meta_title: input.title.slice(0, 70),
      meta_description:
        'À compléter : décrivez clairement le problème, la solution same’z et l’action suivante.',
      canonical_path: path,
      target_slug: input.slug,
      blocks: [
        {
          id: crypto.randomUUID(),
          type: 'hero',
          heading: input.title,
          subheading: '',
        },
      ],
      faq: [],
      sources: [],
      entities: [],
      author_name: "same'z",
      created_by: user.id,
    })
    .select('id')
    .single()
  if (versionError || !version) throw new Error(versionError?.message || 'Version impossible')

  revalidatePath('/admin/seo')
  return { documentId: document.id as string, versionId: version.id as string }
}

export async function saveSeoVersion(documentId: string, versionId: string, raw: unknown) {
  const parsed = versionInputSchema.safeParse(raw)
  if (!parsed.success) throw new Error(readParseError(parsed.error))
  const input = parsed.data
  const { supabase, user } = await requireAdmin()
  const document = await getDocument(supabase, documentId)
  const current = await getVersion(supabase, versionId)
  if (!document || !current) throw new Error('Document introuvable')

  const versions = await listDocumentVersions(supabase, documentId)
  const hasLiveSlug = versions.some(
    item => item.status === 'published' || item.status === 'scheduled'
  )
  const canonical = input.canonicalPath || documentPath(document.type, input.slug)
  const payload = versionRow(
    { ...input, canonicalPath: canonical },
    { ai_generated: current.ai_generated }
  )

  const { error: documentError } = await supabase
    .from('seo_documents')
    .update({
      ...(hasLiveSlug ? {} : { slug: input.slug }),
      silo: input.silo || null,
      is_indexable: input.isIndexable,
    })
    .eq('id', documentId)
  if (documentError) throw new Error(documentError.message)

  if (current.status === 'published' || current.status === 'archived') {
    const versionNumber = await nextVersionNumber(supabase, documentId)
    const { data, error } = await supabase
      .from('seo_document_versions')
      .insert({
        ...payload,
        document_id: documentId,
        version_number: versionNumber,
        status: 'draft',
        created_by: user.id,
        published_at: null,
        publish_at: null,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message || 'Nouveau brouillon impossible')
    revalidatePath(`/admin/seo/${documentId}`)
    return { versionId: data.id as string, forked: true }
  }

  const nextStatus = current.status === 'scheduled' ? 'draft' : current.status
  const { error } = await supabase
    .from('seo_document_versions')
    .update({
      ...payload,
      status: nextStatus,
      publish_at: nextStatus === 'draft' ? null : current.publish_at,
    })
    .eq('id', versionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/seo/${documentId}`)
  return { versionId, forked: false }
}

export async function setSeoStatus(
  versionId: string,
  status: 'draft' | 'in_review' | 'archived'
) {
  const { supabase, user } = await requireAdmin()
  const { error } = await supabase
    .from('seo_document_versions')
    .update({
      status,
      reviewed_by: status === 'in_review' ? user.id : undefined,
    })
    .eq('id', versionId)
  if (error) throw new Error(error.message)
}

export async function publishSeoVersion(versionId: string) {
  const { supabase } = await requireAdmin()
  const version = await getVersion(supabase, versionId)
  if (!version) throw new Error('Version introuvable')
  if (!version.human_reviewed) {
    throw new Error('La relecture humaine est obligatoire avant publication')
  }
  const { error } = await supabase.rpc('publish_seo_version', { p_version_id: versionId })
  if (error) throw new Error(error.message)
  const document = await getDocument(supabase, version.document_id)
  if (document) revalidateSeo(document.type, document.slug)
}

export async function scheduleSeoVersion(versionId: string, publishAtIso: string) {
  const { supabase } = await requireAdmin()
  const version = await getVersion(supabase, versionId)
  if (!version) throw new Error('Version introuvable')
  if (!version.human_reviewed) {
    throw new Error('La relecture humaine est obligatoire avant programmation')
  }
  const when = new Date(publishAtIso)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    throw new Error('Date de publication future requise')
  }
  await supabase
    .from('seo_document_versions')
    .update({ status: 'archived', publish_at: null })
    .eq('document_id', version.document_id)
    .eq('status', 'scheduled')
    .neq('id', versionId)
  const { error } = await supabase
    .from('seo_document_versions')
    .update({ status: 'scheduled', publish_at: when.toISOString() })
    .eq('id', versionId)
  if (error) throw new Error(error.message)
  const document = await getDocument(supabase, version.document_id)
  if (document) revalidateSeo(document.type, document.slug)
}

export async function restoreSeoVersion(documentId: string, versionId: string) {
  const { supabase, user } = await requireAdmin()
  const source = await getVersion(supabase, versionId)
  if (!source || source.document_id !== documentId) throw new Error('Version introuvable')
  const versionNumber = await nextVersionNumber(supabase, documentId)
  const { data, error } = await supabase
    .from('seo_document_versions')
    .insert({
      document_id: documentId,
      version_number: versionNumber,
      status: 'draft',
      title: source.title,
      h1: source.h1,
      excerpt: source.excerpt,
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      canonical_path: source.canonical_path,
      og_image_url: source.og_image_url,
      og_title: source.og_title,
      og_description: source.og_description,
      robots_index: source.robots_index,
      robots_follow: source.robots_follow,
      keyword_primary: source.keyword_primary,
      search_intent: source.search_intent,
      audience: source.audience,
      entities: source.entities,
      factual_summary: source.factual_summary,
      geo_locality: source.geo_locality,
      geo_region: source.geo_region,
      blocks: source.blocks,
      faq: source.faq,
      sources: source.sources,
      extra_json_ld: source.extra_json_ld,
      target_slug: source.target_slug,
      cta_label: source.cta_label,
      cta_href: source.cta_href,
      author_name: source.author_name,
      ai_generated: source.ai_generated,
      human_reviewed: false,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Restauration impossible')
  revalidatePath(`/admin/seo/${documentId}`)
  return { versionId: data.id as string }
}

export async function replaceInternalLinks(
  versionId: string,
  links: unknown
) {
  const parsed = internalLinkInputSchema.array().max(20).parse(links)
  const { supabase } = await requireAdmin()
  const { error: delError } = await supabase
    .from('seo_internal_links')
    .delete()
    .eq('source_version_id', versionId)
  if (delError) throw new Error(delError.message)
  if (parsed.length === 0) return
  const { error } = await supabase.from('seo_internal_links').insert(
    parsed.map((link, index) => ({
      source_version_id: versionId,
      target_document_id: link.targetDocumentId,
      anchor_text: link.anchorText,
      rel: link.rel || null,
      approved: link.approved,
      order_index: index,
    }))
  )
  if (error) throw new Error(error.message)
}

export async function createRedirect(fromPath: string, toPath: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('seo_redirects').insert({
    from_path: fromPath,
    to_path: toPath,
  })
  if (error) throw new Error(error.message)
}

export async function registerSeoMedia(path: string, publicUrl: string, alt: string) {
  const { supabase, user } = await requireAdmin()
  const { error } = await supabase.from('seo_media').insert({
    path,
    public_url: publicUrl,
    alt,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
}

export async function applyGeneratedDraft(
  documentId: string,
  versionId: string,
  generated: VersionInput,
  aiGenerated: boolean
) {
  return saveSeoVersion(documentId, versionId, {
    ...generated,
    humanReviewed: false,
  }).then(async result => {
    const { supabase } = await requireAdmin()
    await supabase
      .from('seo_document_versions')
      .update({ ai_generated: aiGenerated, human_reviewed: false, status: 'draft' })
      .eq('id', result.versionId)
    return result
  })
}
