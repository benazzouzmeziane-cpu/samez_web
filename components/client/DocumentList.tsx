'use client'

import { useState } from 'react'
import { formatDateFr, formatEuro } from '@/lib/client/format'
import type { ClientPiece } from '@/lib/client/types'
import StatusBadge from '@/components/client/StatusBadge'
import { IconChevron, IconDownload } from '@/components/client/icons'

function typeLabel(type: string) {
  return type === 'devis' ? 'Devis' : 'Facture'
}

function DocumentRow({ piece }: { piece: ClientPiece }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="client-enter border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="client-row client-press w-full text-left px-4 md:px-5 py-4 flex items-start gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
              {typeLabel(piece.type)}
            </span>
            <StatusBadge status={piece.displayStatus} />
          </div>
          <p className="font-display text-[15px] font-semibold tracking-tight">{piece.number}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDateFr(piece.date)}
            {piece.due_date && (
              <>
                {' · '}
                <span className={piece.isOverdue ? 'text-orange-400' : undefined}>
                  échéance {formatDateFr(piece.due_date)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="text-right shrink-0 pt-0.5">
          <p className="font-display text-[15px] font-semibold tracking-tight tabular-nums">
            {formatEuro(piece.totalTTC)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">TTC</p>
        </div>
        <IconChevron
          className={`w-4 h-4 text-slate-500 mt-1 shrink-0 transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div className="client-doc-panel" data-open={open}>
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 md:px-5 pb-5">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left font-medium pb-2">Prestation</th>
                    <th className="text-right font-medium pb-2 w-12">Qté</th>
                    <th className="text-right font-medium pb-2 w-20 hidden sm:table-cell">P.U. HT</th>
                    <th className="text-right font-medium pb-2 w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {piece.lines.map((line, index) => (
                    <tr key={`${piece.id}-${index}`} className="text-slate-300">
                      <td className="py-1.5 pr-3">{line.description}</td>
                      <td className="text-right py-1.5 tabular-nums">{line.quantity}</td>
                      <td className="text-right py-1.5 tabular-nums hidden sm:table-cell">
                        {formatEuro(Number(line.unit_price))}
                      </td>
                      <td className="text-right py-1.5 tabular-nums font-medium">
                        {formatEuro(Number(line.quantity) * Number(line.unit_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-500">
                <span>HT {formatEuro(piece.totalHT)}</span>
                <span>
                  TVA ({piece.tva_rate}%) {formatEuro(piece.totalHT * (piece.tva_rate / 100))}
                </span>
                <span className="font-semibold text-white">TTC {formatEuro(piece.totalTTC)}</span>
              </div>

              {piece.paid_date && (
                <p className="text-xs text-[var(--accent)] mt-3">
                  Réglée le {formatDateFr(piece.paid_date)}
                  {piece.payment_method ? ` · ${piece.payment_method}` : ''}
                </p>
              )}

              {piece.notes && (
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{piece.notes}</p>
              )}

              <div className="mt-4 flex justify-end">
                <a
                  href={`/api/pieces/pdf/${piece.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="client-press inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]"
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  Télécharger le PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function DocumentList({ pieces }: { pieces: ClientPiece[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] overflow-hidden">
      {pieces.map((piece) => (
        <DocumentRow key={piece.id} piece={piece} />
      ))}
    </div>
  )
}
