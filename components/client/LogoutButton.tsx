'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IconLogout } from '@/components/client/icons'

export default function LogoutButton({
  className = '',
  label = 'Déconnexion',
}: {
  className?: string
  label?: string
}) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    window.location.href = '/'
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      <IconLogout className="w-4 h-4" />
      {label}
    </button>
  )
}
