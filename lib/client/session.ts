import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { mapPiece } from '@/lib/client/pieces'
import type { ClientBooking, ClientPiece, ClientRecord } from '@/lib/client/types'

export const getClientContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/espace-client')

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, phone, address')
    .eq('email', user.email!)
    .maybeSingle()

  return {
    supabase,
    user,
    client: (client as ClientRecord | null) ?? null,
  }
})

export const getClientPieces = cache(async (clientId: string): Promise<ClientPiece[]> => {
  const supabase = await createClient()
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, piece_lines(*)')
    .eq('client_id', clientId)
    .neq('status', 'brouillon')
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  return (pieces ?? []).map((piece) => mapPiece(piece, today))
})

export const getUpcomingBookings = cache(async (): Promise<ClientBooking[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id, starts_at, ends_at, status, meet_link, notes')
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(3)

  if (error || !data) return []
  return data as ClientBooking[]
})
