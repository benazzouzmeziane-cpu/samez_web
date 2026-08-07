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

function isRateLimited(key: string, windowMs: number): boolean {
  const now = Date.now()
  const last = rateLimitMap.get(key)
  if (last && now - last < windowMs) return true
  rateLimitMap.set(key, now)
  return false
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
    const emailKey = email.toLowerCase()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (
      isRateLimited(`forgot-ip:${ip}`, IP_WINDOW) ||
      isRateLimited(`forgot-email:${emailKey}`, EMAIL_WINDOW)
    ) {
      return NextResponse.json({ success: true })
    }

    const adminClient = createServiceSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      // Email inconnu ou erreur → réponse neutre
      console.log('[forgot-password] generateLink failed:', linkError?.message)
      return NextResponse.json({ success: true })
    }

    const user = linkData.user
    if (user?.app_metadata?.role !== 'client') {
      return NextResponse.json({ success: true })
    }

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://samez.fr'
        : `http://${request.headers.get('host') || 'localhost:3000'}`
    const resetUrl = `${baseUrl}/espace-client/nouveau-mot-de-passe?token_hash=${linkData.properties.hashed_token}&type=recovery`
    const name = (user.user_metadata?.name as string | undefined) || email.split('@')[0]

    await sendPasswordResetEmail({
      name,
      email,
      resetUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
