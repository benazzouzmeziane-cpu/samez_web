'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first offset
  const startOffset = (first.getDay() + 6) % 7
  const cells: (number | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const SLOTS = ['09:30', '11:00', '14:00', '16:30']

export default function BookingWidget() {
  const now = useMemo(() => new Date(), [])
  const [monthOffset, setMonthOffset] = useState(0)
  const view = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  }, [now, monthOffset])

  const year = view.getFullYear()
  const month = view.getMonth()
  const cells = useMemo(() => buildMonth(year, month), [year, month])
  const label = view.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const today = now.getDate()
  const isCurrentMonth = monthOffset === 0
  const [selected, setSelected] = useState<number | null>(isCurrentMonth ? Math.min(today + 2, 28) : 12)
  const [slot, setSlot] = useState(SLOTS[1])

  const available = (day: number) => {
    if (monthOffset < 0) return false
    if (isCurrentMonth && day < today) return false
    const date = new Date(year, month, day)
    const wd = date.getDay()
    return wd !== 0 && wd !== 6
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] bg-white text-[var(--navy)]">
      <div className="bg-[var(--navy-soft)] px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[var(--accent)] uppercase mb-1">
            Échange en visio
          </p>
          <p className="font-display text-lg font-semibold text-white leading-tight">
            Réserver un créneau
          </p>
          <p className="text-xs text-slate-400 mt-1">
            On cartographie votre besoin — sans engagement.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[var(--accent)] text-[var(--navy)]">
          Gratuit
        </span>
      </div>

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-base font-semibold capitalize">{label}</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMonthOffset(m => Math.max(0, m - 1))}
              disabled={monthOffset === 0}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 transition-[transform] duration-[var(--duration-press)] ease-[var(--ease-out)] active:scale-[0.97]"
              aria-label="Mois précédent"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMonthOffset(m => Math.min(2, m + 1))}
              disabled={monthOffset >= 2}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 transition-[transform] duration-[var(--duration-press)] ease-[var(--ease-out)] active:scale-[0.97]"
              aria-label="Mois suivant"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map(d => (
            <span key={d} className="text-[10px] font-medium text-slate-400 text-center py-1">
              {d}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`e-${i}`} />
            const ok = available(day)
            const isSelected = selected === day
            return (
              <button
                key={day}
                type="button"
                disabled={!ok}
                onClick={() => setSelected(day)}
                className={`aspect-square rounded-lg text-sm font-medium transition-[background-color,color,transform] duration-[var(--duration-ui)] ease active:scale-[0.97] ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--navy)]'
                    : ok
                      ? 'bg-[#eef6f1] text-[var(--navy)] hover:bg-[var(--accent-light)]'
                      : 'text-slate-300'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Créneau préféré</p>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={`py-2 rounded-lg text-xs font-semibold transition-[background-color,color,transform] duration-[var(--duration-ui)] ease active:scale-[0.97] ${
                  slot === s
                    ? 'bg-[var(--navy)] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 bg-[var(--navy)] text-white">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-300 mb-3">
          <span>✓ 45 min</span>
          <span>✓ 100% gratuit</span>
          <span>✓ Sans engagement</span>
          <span>✓ En visio</span>
        </div>
        <Link
          href="/#contact"
          className="btn btn-primary w-full !rounded-xl"
        >
          Confirmer et écrire mon besoin
        </Link>
      </div>
    </div>
  )
}
