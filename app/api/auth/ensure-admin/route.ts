import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminAllowed } from '@/lib/admin'

/**
 * Après login admin : vérifie l'allowlist et synchronise app_metadata.role = 'admin'
 * pour que les policies RLS fonctionnent.
 */
export async function POST() {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ allowed: false }, { status: 401 })
    }

    if (!isAdminAllowed(user.email)) {
      await authClient.auth.signOut()
      return NextResponse.json(
        { allowed: false, error: 'Compte non autorisé pour l’administration.' },
        { status: 403 }
      )
    }

    if (user.app_metadata?.role !== 'admin') {
      const service = createServiceClient()
      const { error } = await service.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, role: 'admin' },
      })
      if (error) {
        console.error('[ensure-admin] updateUserById failed:', error)
        return NextResponse.json({ allowed: false, error: 'Sync rôle échouée' }, { status: 500 })
      }
      // Rafraîchir la session pour embarquer le nouveau claim JWT
      await authClient.auth.refreshSession()
    }

    return NextResponse.json({ allowed: true })
  } catch (err) {
    console.error('[ensure-admin]', err)
    return NextResponse.json({ allowed: false }, { status: 500 })
  }
}
