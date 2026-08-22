import { primaryAttributionPage, type AttributionRow } from '@/lib/attribution/schema'

export default function AttributionSummary({
  row,
}: {
  row: Partial<AttributionRow>
}) {
  const page = primaryAttributionPage(row)
  if (!page && !row.referrer && !row.utm_source) return null

  return (
    <div className="mt-3 pl-12 text-xs text-slate-500 space-y-1">
      {page ? (
        <p>
          <span className="font-medium text-slate-600">Entrée :</span> {page}
        </p>
      ) : null}
      {row.submit_page && row.submit_page !== page ? (
        <p>
          <span className="font-medium text-slate-600">Conversion :</span> {row.submit_page}
        </p>
      ) : null}
      {row.referrer ? (
        <p className="truncate">
          <span className="font-medium text-slate-600">Referrer :</span> {row.referrer}
        </p>
      ) : null}
      {row.utm_source ? (
        <p>
          <span className="font-medium text-slate-600">UTM :</span>{' '}
          {[row.utm_source, row.utm_medium, row.utm_campaign].filter(Boolean).join(' / ')}
        </p>
      ) : null}
    </div>
  )
}
