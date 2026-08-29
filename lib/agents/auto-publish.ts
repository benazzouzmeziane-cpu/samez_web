import type { SupabaseClient } from '@supabase/supabase-js'
import {
  cannibalizationMessage,
  findCannibalizationConflicts,
} from '@/lib/seo/cannibalization'
import { revalidateSeo } from '@/lib/seo/cache'
import { computeQualityReport } from '@/lib/seo/quality-score'
import { documentPath } from '@/lib/seo/paths'
import { getDocument, getVersion, listLiveDocuments } from '@/lib/seo/queries'

export const MIN_AGENT_PUBLISH_SCORE = 90

/**
 * Publication automatique très restrictive.
 * Elle n'est appelée qu'après validation du critique multi-agent.
 */
export async function autoPublishSeoVersion(
  supabase: SupabaseClient,
  versionId: string,
  runId: string
) {
  const version = await getVersion(supabase, versionId)
  if (!version) throw new Error('Version SEO introuvable')
  const document = await getDocument(supabase, version.document_id)
  if (!document) throw new Error('Document SEO introuvable')
  if (!version.ai_generated || version.status !== 'in_review') {
    throw new Error('Publication automatique réservée aux brouillons IA explicitement placés en relecture')
  }
  if (!version.sources.length) throw new Error('Publication automatique bloquée : aucune source')

  const quality = computeQualityReport({
    title: version.title,
    metaTitle: version.meta_title || version.title,
    metaDescription: version.meta_description || '',
    canonicalPath: version.canonical_path || documentPath(document.type, document.slug),
    blocks: version.blocks,
    faq: version.faq,
    sources: version.sources,
    humanReviewed: true,
    keywordPrimary: version.keyword_primary,
  })
  if (quality.blockers.length || quality.score < MIN_AGENT_PUBLISH_SCORE) {
    throw new Error(
      `Publication automatique bloquée : score ${quality.score}/${MIN_AGENT_PUBLISH_SCORE}${quality.blockers.length ? ` · ${quality.blockers.join(', ')}` : ''}`
    )
  }

  const live = await listLiveDocuments(supabase)
  const conflicts = findCannibalizationConflicts(
    version.keyword_primary || version.title,
    document.id,
    live.map(page => ({
      id: page.id,
      slug: page.slug,
      path: page.path,
      title: page.version.title,
      keywordPrimary: page.version.keyword_primary,
    }))
  )
  const conflict = cannibalizationMessage(conflicts)
  if (conflict) throw new Error(conflict)

  const { error: markError } = await supabase
    .from('seo_document_versions')
    .update({
      review_notes: `Relecture automatique multi-agent validée · run ${runId} · score ${quality.score}/100`,
      agent_reviewed_at: new Date().toISOString(),
      agent_review_run_id: runId,
      agent_review_score: quality.score,
    })
    .eq('id', versionId)
    .eq('status', 'in_review')
  if (markError) throw new Error(markError.message)

  const { error } = await supabase.rpc('publish_seo_version', { p_version_id: versionId })
  if (error) throw new Error(error.message)
  revalidateSeo(document.type, document.slug)
  return { documentId: document.id, path: documentPath(document.type, document.slug), score: quality.score }
}
