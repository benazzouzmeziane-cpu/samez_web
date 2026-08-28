import Link from 'next/link'
import { convertRadarItem, updateRadarStatus } from '@/lib/admin/crm-actions'
import { FIT_LABELS, FIT_STYLES, KIND_LABELS, OFFER_LABELS, STATUS_LABELS } from '@/lib/radar/labels'
import type { RadarItem } from '@/lib/radar/types'
import { formatDateShort } from '@/lib/client/format'

export default function RadarCard({ item }: { item: RadarItem }) {
  const fit = item.fit
  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--navy)]">{item.title}</p>
          <p className="text-xs text-slate-500 mt-1">
            {KIND_LABELS[item.kind]}
            {item.city ? ` · ${item.city}` : ''}
            {item.department ? ` (${item.department})` : ''}
            {item.contact_name ? ` · ${item.contact_name}` : ''}
          </p>
          {item.subtitle ? <p className="text-sm text-slate-600 mt-2">{item.subtitle}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="tabular-nums text-lg font-semibold">{item.score ?? item.pre_score}</span>
          {fit ? (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${FIT_STYLES[fit]}`}>{FIT_LABELS[fit]}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span>{STATUS_LABELS[item.status]}</span>
        {item.offer ? <span>· {OFFER_LABELS[item.offer]}</span> : null}
        {item.published_at ? <span>· {formatDateShort(item.published_at)}</span> : null}
        {item.deadline_at ? <span>· limite {formatDateShort(item.deadline_at)}</span> : null}
      </div>

      {item.reasons.length > 0 ? (
        <ul className="text-sm text-slate-600 space-y-1">
          {item.reasons.map(reason => (
            <li key={reason}>· {reason}</li>
          ))}
        </ul>
      ) : null}

      {item.next_action ? <p className="text-sm text-[var(--navy)]">{item.next_action}</p> : null}

      {item.approach_body ? (
        <div className="rounded-xl bg-slate-50 p-3">
          {item.approach_subject ? (
            <p className="text-xs font-medium text-slate-500 mb-1">{item.approach_subject}</p>
          ) : null}
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.approach_body}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-dark)]">
            Source
          </a>
        ) : null}
        {item.client_id ? (
          <Link href={`/admin/clients/${item.client_id}`} className="text-xs text-[var(--accent-dark)]">
            Dossier
          </Link>
        ) : item.status !== 'ecarte' ? (
          <form action={convertRadarItem}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full bg-[var(--navy)] text-white font-medium">
              Ouvrir une fiche
            </button>
          </form>
        ) : null}
        {item.status !== 'ecarte' && item.status !== 'converti' ? (
          <StatusButton id={item.id} status="ecarte" label="Écarter" />
        ) : null}
        {item.status === 'a_contacter' ? (
          <StatusButton id={item.id} status="contacte" label="Marquer contacté" />
        ) : null}
        {item.status === 'nouveau' && item.fit === 'go' ? (
          <StatusButton id={item.id} status="a_contacter" label="À contacter" />
        ) : null}
      </div>
    </article>
  )
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={updateRadarStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full border border-black/10 text-slate-600 font-medium">
        {label}
      </button>
    </form>
  )
}
