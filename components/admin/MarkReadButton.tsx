'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()

  const handleMark = async () => {
    const supabase = createClient()
    await supabase.from('contacts').update({ read: true }).eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleMark}
      className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      Marquer lu
    </button>
  )
}
