import { NextResponse } from 'next/server'
import { sendContactEmail, sendClientInviteEmail } from '@/lib/email'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  createAccount: z.boolean().optional(),
})

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = createAdminClient()

    // Insérer le message de contact
    const { error } = await supabase.from('contacts').insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    }])

    if (error) {
      console.error('[contact] DB insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Créer le compte client si demandé
    if (data.createAccount) {
      await createClientAccount(supabase, data)
    }

    // Envoyer l'email de notification à l'admin
    try {
      await sendContactEmail(data)
    } catch (emailError) {
      console.error('[contact] Admin notification email error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 })
    }
    console.error('[contact] API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function createClientAccount(
  supabase: ReturnType<typeof createAdminClient>,
  data: { name: string; email: string; phone?: string }
) {
  // 1. Upsert dans la table clients
  const { error: clientError } = await supabase.from('clients').upsert(
    [{ name: data.name, email: data.email, phone: data.phone || null }],
    { onConflict: 'email' }
  )
  if (clientError) {
    console.error('[contact] Client upsert error:', clientError)
  }

  // 2. Tenter de créer l'utilisateur Auth (échouera s'il existe déjà)
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { role: 'client', name: data.name },
  })

  if (authError) {
    // L'utilisateur existe probablement déjà — on tente quand même d'envoyer un nouveau lien
    console.log('[contact] User may already exist, generating new link anyway:', authError.message)
  }

  // 3. Générer un magic link (fonctionne que l'utilisateur soit nouveau ou existant)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: data.email,
  })

  if (linkError) {
    console.error('[contact] Magic link generation failed:', linkError)
    return
  }

  const tokenHash = linkData?.properties?.hashed_token
  if (!tokenHash) {
    console.error('[contact] No hashed_token in generateLink response:', linkData)
    return
  }

  // 4. Envoyer l'email d'invitation
  const inviteUrl = `https://samez.fr/espace-client/nouveau-mot-de-passe?token_hash=${tokenHash}&type=magiclink`
  try {
    await sendClientInviteEmail({
      name: data.name,
      email: data.email,
      inviteUrl,
    })
    console.log('[contact] Invite email sent to:', data.email)
  } catch (inviteEmailError) {
    console.error('[contact] Invite email send failed:', inviteEmailError)
  }
}
