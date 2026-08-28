export const dynamic = 'force-dynamic'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminChip from '@/components/admin/AdminChip'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import RadarSyncButton from '@/components/admin/radar/RadarSyncButton'
import RadarCard from '@/components/admin/radar/RadarCard'
import { createClient } from '@/lib/supabase/server'
import { latestRadarRun, listRadarItems } from '@/lib/radar/store'
import type { RadarFit, RadarStatus } from '@/lib/radar/types'

export default async function AdminRadarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; fit?: string; status?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'marches' ? 'marches' : 'entreprises'
  const fit = (['go', 'possible', 'nogo'].includes(params.fit ?? '') ? params.fit : 'all') as RadarFit | 'all'
  const status = (
    ['nouveau', 'a_contacter', 'contacte', 'converti', 'ecarte'].includes(params.status ?? '')
      ? params.status
      : 'all'
  ) as RadarStatus | 'all'

  const supabase = await createClient()
  let items: Awaited<ReturnType<typeof listRadarItems>> = []
  let run: Awaited<ReturnType<typeof latestRadarRun>> = null
  let loadError: string | null = null
  try {
    ;[items, run] = await Promise.all([
      listRadarItems(supabase, { tab, fit, status }),
      latestRadarRun(supabase),
    ])
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Radar indisponible'
  }

  const qs = (next: Record<string, string>) => {
    const merged = { tab, fit, status, ...next }
    const search = new URLSearchParams()
    if (merged.tab !== 'entreprises') search.set('tab', merged.tab)
    if (merged.fit !== 'all') search.set('fit', merged.fit)
    if (merged.status !== 'all') search.set('status', merged.status)
    const value = search.toString()
    return value ? `/admin/radar?${value}` : '/admin/radar'
  }

  return (
    <div>
      <AdminPageHeader
        title="Radar"
        description="Créations et cessions BODACC enrichies Sirene, marchés BOAMP, score déterministe puis qualification IA. Rien n’est envoyé au prospect."
        actions={<RadarSyncButton />}
      />

      {run ? (
        <p className="text-xs text-slate-500 mb-5">
          Dernier run : {run.status}
          {run.finished_at ? ` · ${new Date(run.finished_at).toLocaleString('fr-FR')}` : ''}
          {` · ${run.fetched} lus · ${run.kept} retenus · ${run.scored} scorés`}
          {run.error ? ` · ${run.error}` : ''}
        </p>
      ) : null}

      {loadError ? (
        <AdminEmptyState
          title="Migration radar requise"
          body="Applique supabase/migrations/20260828_radar.sql dans Supabase, puis relance le radar."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <AdminChip href={qs({ tab: 'entreprises' })} active={tab === 'entreprises'}>
              Entreprises
            </AdminChip>
            <AdminChip href={qs({ tab: 'marches' })} active={tab === 'marches'}>
              Marchés publics
            </AdminChip>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <AdminChip href={qs({ fit: 'all' })} active={fit === 'all'}>
              Tous scores
            </AdminChip>
            <AdminChip href={qs({ fit: 'go' })} active={fit === 'go'}>
              Go
            </AdminChip>
            <AdminChip href={qs({ fit: 'possible' })} active={fit === 'possible'}>
              Possible
            </AdminChip>
            <AdminChip href={qs({ status: 'a_contacter' })} active={status === 'a_contacter'}>
              À contacter
            </AdminChip>
            <AdminChip href={qs({ status: 'ecarte' })} active={status === 'ecarte'}>
              Écartés
            </AdminChip>
          </div>

          {items.length === 0 ? (
            <AdminEmptyState
              title="Aucune piste"
              body="Lance le radar pour tirer les créations BODACC, enrichir via Sirene et scorer les avis BOAMP."
            />
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <RadarCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
