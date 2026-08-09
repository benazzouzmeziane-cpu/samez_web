import { NextResponse } from 'next/server'
import { createClient as createServiceSupabase } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().max(254),
})

const rateLimitMap = new Map<string, number>()
const IP_WINDOW = 15 * 60 * 1000
const EMAIL_WINDOW = 60 * 60 * 1000

function wasRecentlySent(key: string, windowMs: number): boolean {
  const last = rateLimitMap.get(key)
  return Boolean(last && Date.now() - last < windowMs)
}

function markSent(key: string) {
  rateLimitMap.set(key, Date.now())
}

function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  if (!host) return false

  const expectedHosts = [host]
  if (process.env.NODE_ENV !== 'production') {
    expectedHosts.push('localhost:3000')
  }

  const check = (value: string | null) => {
    if (!value) return false
    try {
      return expectedHosts.includes(new URL(value).host)
    } catch {
      return false
    }
  }

  return check(origin) || check(referer)
}

/**
 * Reset mot de passe espace client.
 * Réponse toujours neutre (pas d'énumération d'emails).
 */
export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = schema.parse(body)
    const emailKey = email.toLowerCase().trim()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    // Rate-limit uniquement après un envoi réussi (sinon un échec bloque 1h)
    if (
      wasRecentlySent(`forgot-ip:${ip}`, IP_WINDOW) ||
      wasRecentlySent(`forgot-email:${emailKey}`, EMAIL_WINDOW)
    ) {
      console.log('[forgot-password] rate-limited (already sent recently):', emailKey)
      return NextResponse.json({ success: true })
    }

    const adminClient = createServiceSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: emailKey,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.log('[forgot-password] generateLink failed:', linkError?.message)
      return NextResponse.json({ success: true })
    }

    const user = linkData.user
    const role = user?.app_metadata?.role

    // Autoriser si rôle client OU email présent dans la table clients
    let isClient = role === 'client'
    if (!isClient) {
      const { data: clientRow } = await adminClient
        .from('clients')
        .select('id, email, name')
        .ilike('email', emailKey)
        .maybeSingle()

      if (clientRow) {
        isClient = true
        // Réparer le claim manquant pour les prochains accès
        if (user?.id && role !== 'client') {
          const { error: metaErr } = await adminClient.auth.admin.updateUserById(user.id, {
            app_metadata: { ...user.app_metadata, role: 'client' },
          })
          if (metaErr) {
            console.warn('[forgot-password] failed to sync client role:', metaErr.message)
          } else {
            console.log('[forgot-password] synced app_metadata.role=client for', emailKey)
          }
        }
      }
    }

    if (!isClient) {
      console.log('[forgot-password] skipped: not a client account:', emailKey, 'role=', role)
      return NextResponse.json({ success: true })
    }

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://samez.fr'
        : `http://${request.headers.get('host') || 'localhost:3000'}`
    const resetUrl = `${baseUrl}/espace-client/nouveau-mot-de-passe?token_hash=${linkData.properties.hashed_token}&type=recovery`
    const name = (user?.user_metadata?.name as string | undefined) || emailKey.split('@')[0]

    try {
      await sendPasswordResetEmail({
        name,
        email: emailKey,
        resetUrl,
      })
      markSent(`forgot-ip:${ip}`)
      markSent(`forgot-email:${emailKey}`)
      console.log('[forgot-password] reset email sent to:', emailKey)
    } catch (smtpErr) {
      console.error('[forgot-password] SMTP send failed:', smtpErr)
      return NextResponse.json({ error: 'Envoi email impossible' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
