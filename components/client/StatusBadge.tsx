import { STATUS_LABELS } from '@/lib/client/pieces'

const STYLES: Record<string, string> = {
  envoyée: 'bg-sky-400/12 text-sky-300',
  payée: 'bg-emerald-400/12 text-emerald-300',
  annulée: 'bg-white/[0.06] text-slate-500',
  'en retard': 'bg-orange-400/12 text-orange-300',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${
        STYLES[status] ?? 'bg-white/[0.06] text-slate-400'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
