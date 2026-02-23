import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendClientInviteEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que l'utilisateur existe et est un client
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const user = existingUsers?.users?.find(
      u => u.email === email && u.user_metadata?.role === 'client'
    )

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return NextResponse.json({ success: true })
    }

    // Générer un nouveau magic link et extraire le token_hash
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Resend link error:', linkError)
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    }

    // Construire notre propre URL avec le token_hash
    const inviteUrl = `https://samez.fr/espace-client/nouveau-mot-de-passe?token_hash=${linkData.properties.hashed_token}&type=magiclink`
    const name = user.user_metadata?.name || email.split('@')[0]
    await sendClientInviteEmail({
      name,
      email,
      inviteUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    console.error('Resend invite error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
