export const dynamic = 'force-dynamic'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SeoOpportunitiesPanel from '@/components/admin/seo/SeoOpportunitiesPanel'
import { createClient } from '@/lib/supabase/server'
import { seoResearchResultSchema, type SeoResearchResult } from '@/lib/seo/research-schema'
import { latestResearchRun } from '@/lib/seo/research-runs'

export default async function SeoOpportunitiesPage() {
  const supabase = await createClient()
  const run = await latestResearchRun(supabase).catch(() => null)
  const parsed = seoResearchResultSchema.safeParse(run?.output)
  const initialResult: SeoResearchResult | null = parsed.success ? parsed.data : null

  return (
    <div>
      <AdminPageHeader
        title="Opportunités SEO"
        description="Recherche concurrentielle France : sujets à potentiel commercial, sources et briefs prêts à relire."
      />
      <SeoOpportunitiesPanel initialResult={initialResult} initialRunId={run?.id || null} />
    </div>
  )
}
