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
      className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
    >
      {error ? 'Réessayer' : loading ? '...' : 'Marquer lu'}
    </button>
  )
}
