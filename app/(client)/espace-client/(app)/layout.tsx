import type { ReactNode } from 'react'
import ClientPortalFrame from '@/components/client/ClientPortalFrame'
import { getClientContext } from '@/lib/client/session'

export const dynamic = 'force-dynamic'

export default async function ClientAppLayout({ children }: { children: ReactNode }) {
  const { user, client } = await getClientContext()

  return (
    <ClientPortalFrame
      name={client?.name ?? user.email ?? 'Client'}
      email={user.email ?? ''}
    >
      {children}
    </ClientPortalFrame>
  )
}
