'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BOOKING_SLOTS } from '@/lib/booking'

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (first.getDay() + 6) % 7
  const cells: (number | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

type Step = 'pick' | 'details' | 'success'

export default function BookingWidget() {
  const now = useMemo(() => new Date(), [])
  const [monthOffset, setMonthOffset] = useState(0)
  const view = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
    [now, monthOffset]
  )
  const year = view.getFullYear()
  const month = view.getMonth()
  const cells = useMemo(() => buildMonth(year, month), [year, month])
  const label = view.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const todayStr = useMemo(() => {
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    return toDateStr(y, m, d)
  }, [now])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [taken, setTaken] = useState<{ date: string; slot: string }[]>([])
  const [step, setStep] = useState<Step>('pick')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [website, setWebsite] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successLabel, setSuccessLabel] = useState('')

  const range = useMemo(() => {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 3, 0)
    return {
      from: toDateStr(from.getFullYear(), from.getMonth(), 1),
      to: toDateStr(to.getFullYear(), to.getMonth(), to.getDate()),
    }
  }, [now])

  const loadTaken = useCallback(async () => {
    try {
      const res = await fetch(`/api/booking?from=${range.from}&to=${range.to}`)
      if (!res.ok) return
      const data = await res.json()
      setTaken(data.taken ?? [])
    } catch {
      /* ignore */
    }
  }, [range.from, range.to])

  useEffect(() => {
    loadTaken()
  }, [loadTaken])

  const isPastDay = (day: number) => {
    const ds = toDateStr(year, month, day)
    return ds < todayStr
  }

  const available = (day: number) => {
    if (isPastDay(day)) return false
    const date = new Date(year, month, day)
    const wd = date.getDay()
    if (wd === 0 || wd === 6) return false
    const ds = toDateStr(year, month, day)
    const freeSlots = BOOKING_SLOTS.filter(
      s => !taken.some(t => t.date === ds && t.slot === s)
    )
    return freeSlots.length > 0
  }

  const openSlots = useMemo(() => {
    if (!selectedDate) return []
    return BOOKING_SLOTS.filter(s => {
      if (taken.some(t => t.date === selectedDate && t.slot === s)) return false
      // block slots less than 1h away for today
      if (selectedDate === todayStr) {
        const [hh, mm] = s.split(':').map(Number)
        const slotDate = new Date(now)
        slotDate.setHours(hh, mm, 0, 0)
        if (slotDate.getTime() <= now.getTime() + 60 * 60 * 1000) return false
      }
      return true
    })
  }, [selectedDate, taken, todayStr, now])

  useEffect(() => {
    if (slot && !openSlots.includes(slot as (typeof BOOKING_SLOTS)[number])) {
      setSlot(openSlots[0] ?? null)
    }
  }, [openSlots, slot])

  const canContinue = Boolean(selectedDate && slot)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !slot) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          date: selectedDate,
          slot,
          notes: notes || undefined,
          website,
          startedAt,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) await loadTaken()
        setError(data.error || 'Impossible de réserver. Réessayez.')
        setLoading(false)
        return
      }
      setSuccessLabel(data.label || '')
      setStep('success')
      await loadTaken()
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] bg-white text-[var(--navy)]">
        <div className="bg-[var(--navy-soft)] px-5 py-4">
          <p className="text-[11px] font-semibold tracking-wider text-[var(--accent)] uppercase mb-1">
            Confirmé
          </p>
          <p className="font-display text-lg font-semibold text-white">Rendez-vous réservé</p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="font-display text-base font-semibold mb-2 capitalize">{successLabel}</p>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Un email de confirmation avec fichier calendrier (.ics) vous a été envoyé.
            Le lien visio vous sera précisé avant l&apos;échange.
          </p>
          <button
            type="button"
            className="btn btn-on-light w-full !rounded-xl"
            onClick={() => {
              setStep('pick')
              setSelectedDate(null)
              setSlot(null)
              setName('')
              setEmail('')
              setPhone('')
              setNotes('')
              setSuccessLabel('')
            }}
          >
            Réserver un autre créneau
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] bg-white text-[var(--navy)]">
      <div className="bg-[var(--navy-soft)] px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[var(--accent)] uppercase mb-1">
            Échange en visio
          </p>
          <p className="font-display text-lg font-semibold text-white leading-tight">
            {step === 'details' ? 'Vos coordonnées' : 'Réserver un créneau'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            45 min · gratuit · sans engagement
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[var(--accent)] text-[var(--navy)]">
          Gratuit
        </span>
      </div>

      {step === 'pick' ? (
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
              const ds = toDateStr(year, month, day)
              const isSelected = selectedDate === ds
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    setSelectedDate(ds)
                    setSlot(null)
                  }}
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

          {selectedDate && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Créneau</p>
              {openSlots.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun créneau libre ce jour.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {openSlots.map(s => (
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
              )}
            </div>
          )}
        </div>
      ) : (
        <form id="booking-form" onSubmit={onSubmit} className="px-5 pt-5 pb-4 space-y-3">
          <p className="text-xs text-slate-500 mb-1">
            {selectedDate && slot
              ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }) + ` · ${slot}`
              : null}
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nom *</label>
            <input
              required
              minLength={2}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
              placeholder="jean@exemple.fr"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
              placeholder="06 xx xx xx xx"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Besoin (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--accent)] resize-none"
              placeholder="En une phrase…"
            />
          </div>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      )}

      <div className="px-5 py-4 bg-[var(--navy)] text-white">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-300 mb-3">
          <span>✓ 45 min</span>
          <span>✓ 100% gratuit</span>
          <span>✓ Sans engagement</span>
          <span>✓ En visio</span>
        </div>
        {step === 'pick' ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep('details')}
            className="btn btn-primary w-full !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('pick')
                setError('')
              }}
              className="btn btn-secondary w-1/3 !rounded-xl !text-white !border-white/20"
            >
              Retour
            </button>
            <button
              type="submit"
              form="booking-form"
              disabled={loading}
              className="btn btn-primary flex-1 !rounded-xl disabled:opacity-50"
            >
              {loading ? 'Réservation…' : 'Confirmer le RDV'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
