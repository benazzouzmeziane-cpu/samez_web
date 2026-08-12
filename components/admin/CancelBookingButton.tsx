'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelBookingButton({
  id,
  disabled,
}: {
  id: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onCancel = async () => {
    if (!confirm('Annuler ce rendez-vous ? Le créneau redeviendra disponible.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Échec de l’annulation')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCancel}
      disabled={disabled || loading}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      {loading ? '…' : 'Annuler'}
    </button>
  )
}
