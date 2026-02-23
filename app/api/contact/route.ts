import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createServiceClient()
    const { error } = await supabase.from('contacts').insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Créer le compte client si demandé
    if (data.createAccount) {
      // 1. Upsert dans la table clients
      const { error: clientError } = await supabase.from('clients').upsert(
        [{
          name: data.name,
          email: data.email,
          phone: data.phone || null,
        }],
        { onConflict: 'email' }
      )
      if (clientError) {
        console.error('Client creation error (non-blocking):', clientError)
      }

      // 2. Créer un utilisateur Supabase Auth avec le service role
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await adminClient.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some(u => u.email === data.email)

      if (!userExists) {
        // Créer l'utilisateur avec invitation
        const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: { role: 'client', name: data.name },
        })

        if (authError) {
          console.error('Auth user creation error (non-blocking):', authError)
        } else if (newUser?.user) {
          // Générer un magic link pour que le client se connecte et définisse son MDP
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: data.email,
            options: {
              redirectTo: 'https://samez.fr/espace-client/nouveau-mot-de-passe',
            },
          })

          if (linkError) {
            console.error('Link generation error (non-blocking):', linkError)
          } else if (linkData?.properties?.action_link) {
            // Envoyer l'email d'invitation personnalisé
            try {
              await sendClientInviteEmail({
                name: data.name,
                email: data.email,
                actionLink: linkData.properties.action_link,
              })
            } catch (inviteEmailError) {
              console.error('Invite email error (non-blocking):', inviteEmailError)
            }
          }
        }
      }
    }

    try {
      await sendContactEmail(data)
    } catch (emailError) {
      console.error('Email error (non-blocking):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 })
    }
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
