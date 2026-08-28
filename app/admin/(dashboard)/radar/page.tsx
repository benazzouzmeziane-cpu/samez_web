export const dynamic = 'force-dynamic'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminChip from '@/components/admin/AdminChip'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import RadarSyncButton from '@/components/admin/radar/RadarSyncButton'
import RadarChat from '@/components/admin/radar/RadarChat'
import RadarCard from '@/components/admin/radar/RadarCard'
import { createClient } from '@/lib/supabase/server'
import { latestRadarRun, listRadarItems, listRadarMessages } from '@/lib/radar/store'
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
  let messages: Awaited<ReturnType<typeof listRadarMessages>> = []
  let loadError: string | null = null
  try {
    ;[items, run, messages] = await Promise.all([
      listRadarItems(supabase, { tab, fit, status }),
      latestRadarRun(supabase),
      listRadarMessages(supabase).catch(() => []),
    ])
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Radar indisponible'
  }

  const qs = (next: { tab?: string; fit?: string; status?: string }) => {
    const nextTab = next.tab ?? tab
    const nextFit = next.fit ?? (next.status !== undefined ? 'all' : fit)
    const nextStatus = next.status ?? (next.fit !== undefined ? 'all' : status)
    const search = new URLSearchParams()
    if (nextTab !== 'entreprises') search.set('tab', nextTab)
    if (nextFit !== 'all') search.set('fit', nextFit)
    if (nextStatus !== 'all') search.set('status', nextStatus)
    const value = search.toString()
    return value ? `/admin/radar?${value}` : '/admin/radar'
  }

  return (
    <div>
      <AdminPageHeader
        title="Radar"
        description="Parlez à l’agent : ciblez une recherche, discutez des pistes, puis ouvrez une fiche. Rien n’est envoyé au prospect."
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
          <RadarChat key={messages.at(-1)?.id ?? 'empty'} initialMessages={messages} />

          <div className="flex flex-wrap gap-2 mb-3">
            <AdminChip href={qs({ tab: 'entreprises' })} active={tab === 'entreprises'}>
              Entreprises
            </AdminChip>
            <AdminChip href={qs({ tab: 'marches' })} active={tab === 'marches'}>
              Marchés publics
            </AdminChip>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400 w-14">Score</span>
            <AdminChip href={qs({ fit: 'all' })} active={fit === 'all'}>
              Tous
            </AdminChip>
            <AdminChip href={qs({ fit: 'go' })} active={fit === 'go'}>
              Go
            </AdminChip>
            <AdminChip href={qs({ fit: 'possible' })} active={fit === 'possible'}>
              Possible
            </AdminChip>
            <AdminChip href={qs({ fit: 'nogo' })} active={fit === 'nogo'}>
              No-go
            </AdminChip>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400 w-14">Statut</span>
            <AdminChip href={qs({ status: 'all' })} active={status === 'all'}>
              Tous
            </AdminChip>
            <AdminChip href={qs({ status: 'a_contacter' })} active={status === 'a_contacter'}>
              À contacter
            </AdminChip>
            <AdminChip href={qs({ status: 'contacte' })} active={status === 'contacte'}>
              Contacté
            </AdminChip>
            <AdminChip href={qs({ status: 'ecarte' })} active={status === 'ecarte'}>
              Écartés
            </AdminChip>
          </div>

          {items.length === 0 ? (
            <AdminEmptyState
              title="Aucune piste avec ces filtres"
              body="Change de score ou de statut, ou relance le radar."
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
