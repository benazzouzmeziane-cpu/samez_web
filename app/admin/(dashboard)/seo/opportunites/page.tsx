export const dynamic = 'force-dynamic'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SeoOpportunitiesPanel from '@/components/admin/seo/SeoOpportunitiesPanel'
import { createClient } from '@/lib/supabase/server'
import { seoResearchResultSchema, type SeoResearchResult } from '@/lib/seo/research-schema'

export default async function SeoOpportunitiesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seo_research_runs')
    .select('id, output')
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const parsed = seoResearchResultSchema.safeParse(data?.output)
  const initialResult: SeoResearchResult | null = parsed.success ? parsed.data : null

  return (
    <div>
      <AdminPageHeader
        title="Opportunités SEO"
        description="Recherche concurrentielle France : sujets à potentiel commercial, sources et briefs prêts à relire."
      />
      <SeoOpportunitiesPanel initialResult={initialResult} initialRunId={data?.id || null} />
    </div>
  )
}
