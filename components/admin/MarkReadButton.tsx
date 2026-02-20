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
      className="text-xs text-gray-400 hover:text-black underline underline-offset-2 transition-colors"
    >
      Marquer lu
    </button>
  )
}
