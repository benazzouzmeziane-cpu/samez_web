export const dynamic = 'force-dynamic'

import CreateSeoForm from '@/components/admin/seo/CreateSeoForm'
import type { CreateSeoInitialValues } from '@/components/admin/seo/CreateSeoForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { createClient } from '@/lib/supabase/server'
import { formatProofsForPrompt, listSeoProofs } from '@/lib/seo/proofs'
import { seoResearchResultSchema } from '@/lib/seo/research-schema'
import { getResearchRun } from '@/lib/seo/research-runs'

export default async function NouveauSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string; opportunity?: string }>
}) {
  const { runId, opportunity: opportunityId } = await searchParams
  let initialValues: CreateSeoInitialValues = {}
  const proofs = await listSeoProofs()
  const defaultProofs = formatProofsForPrompt(proofs)
  if (runId && opportunityId) {
    const supabase = await createClient()
    const run = await getResearchRun(supabase, runId).catch(() => null)
    const parsed = seoResearchResultSchema.safeParse(run?.status === 'done' ? run.output : null)
    const opportunity = parsed.success
      ? parsed.data.opportunities.find(item => item.id === opportunityId)
      : null
    if (opportunity) {
      initialValues = {
        type: opportunity.type,
        title: opportunity.title,
        slug: opportunity.slug,
        keyword: opportunity.keywordPrimary,
        intent: opportunity.searchIntent,
        audience: opportunity.audience,
        brief: opportunity.brief,
        proofs: opportunity.proofs,
        angle: opportunity.angle,
        sources: opportunity.sources,
      }
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Demander une page"
        description={
          initialValues.brief
            ? 'Proposition concurrentielle préremplie. Modifiez-la avant de demander le brouillon.'
            : 'Donnez la consigne à l’agent. Il crée un brouillon à relire, jamais une page publiée.'
        }
      />
      <CreateSeoForm initialValues={initialValues} defaultProofs={defaultProofs} />
    </div>
  )
}
