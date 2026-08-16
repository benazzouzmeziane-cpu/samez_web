'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMark = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ read: true })
      .eq('id', id)

    if (updateError) {
      setError('Erreur')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      title={error || undefined}
      className="client-press text-xs px-3 py-1.5 rounded-full border border-black/10 text-slate-500 disabled:opacity-50"
    >
      {error ? 'Réessayer' : loading ? '...' : 'Marquer lu'}
    </button>
  )
}
