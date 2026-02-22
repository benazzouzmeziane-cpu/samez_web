'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  name: string
  email: string
  phone?: string | null
}

export default function CreateDevisButton({ name, email, phone }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Upsert : créer le client ou récupérer l'existant
      const { data: client, error } = await supabase
        .from('clients')
        .upsert(
          { name, email, phone: phone ?? undefined },
          { onConflict: 'email' }
        )
        .select('id')
        .single()

      if (error || !client) {
        // Si l'upsert échoue, essayer de récupérer le client existant
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email)
          .single()

        if (existing) {
          router.push(`/admin/pieces/nouvelle?type=devis&client_id=${existing.id}`)
          return
        }
        alert('Erreur lors de la création du client.')
        return
      }

      router.push(`/admin/pieces/nouvelle?type=devis&client_id=${client.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] font-medium hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Créer un devis'}
    </button>
  )
}
