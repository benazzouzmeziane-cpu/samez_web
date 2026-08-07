import { NextResponse } from 'next/server'
import { createClient as createServiceSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendClientInviteEmail } from '@/lib/email'
import { isAdminUser } from '@/lib/admin'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

const rateLimitMap = new Map<string, number>()
const ADMIN_WINDOW = 60_000
const PUBLIC_IP_WINDOW = 15 * 60 * 1000
const PUBLIC_EMAIL_WINDOW = 60 * 60 * 1000

function isRateLimited(key: string, windowMs: number): boolean {
  const now = Date.now()
  const lastRequest = rateLimitMap.get(key)
  if (lastRequest && now - lastRequest < windowMs) {
    return true
  }
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

export async function POST(request: Request) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    const isAdmin = Boolean(user && isAdminUser(user))

    if (!isAdmin) {
      if (!isTrustedOrigin(request)) {
        return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { email } = schema.parse(body)
    const emailKey = email.toLowerCase()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (isAdmin) {
      if (isRateLimited(`admin:${user!.id}`, ADMIN_WINDOW)) {
        return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
      }
    } else {
      // Public : rate-limit strict, réponses toujours neutres
      if (
        isRateLimited(`public-ip:${ip}`, PUBLIC_IP_WINDOW) ||
        isRateLimited(`public-email:${emailKey}`, PUBLIC_EMAIL_WINDOW)
      ) {
        return NextResponse.json({ success: true })
      }
    }

    const adminClient = createServiceSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.log('[resend-invite] generateLink failed:', linkError?.message)
      return NextResponse.json({ success: true })
    }

    const inviteUser = linkData.user
    if (inviteUser?.app_metadata?.role !== 'client') {
      return NextResponse.json({ success: true })
    }

    const inviteUrl = `https://samez.fr/espace-client/nouveau-mot-de-passe?token_hash=${linkData.properties.hashed_token}&type=magiclink`
    const name = inviteUser.user_metadata?.name || email.split('@')[0]
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
