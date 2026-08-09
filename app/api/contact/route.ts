import { NextResponse } from 'next/server'
import { sendContactEmail, sendClientInviteEmail } from '@/lib/email'
import { timingSafeEqualString } from '@/lib/crypto-safe'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(10).max(5000),
  createAccount: z.boolean().optional(),
  website: z.string().optional(),
  startedAt: z.number().optional(),
})

const ipRateLimitMap = new Map<string, number>()
const emailRateLimitMap = new Map<string, number>()
const contactIpRateLimitMap = new Map<string, number>()
const ACCOUNT_CREATE_IP_WINDOW = 10 * 60 * 1000
const ACCOUNT_CREATE_EMAIL_WINDOW = 24 * 60 * 60 * 1000
const CONTACT_IP_WINDOW = 60 * 1000
const MAX_RATE_LIMIT_ENTRIES = 5000

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function pruneRateLimitMap(map: Map<string, number>, windowMs: number) {
  if (map.size < MAX_RATE_LIMIT_ENTRIES) return
  const now = Date.now()
  for (const [key, ts] of map) {
    if (now - ts > windowMs) map.delete(key)
  }
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

  const isAllowedUrl = (value: string | null) => {
    if (!value) return false
    try {
      const parsed = new URL(value)
      return expectedHosts.includes(parsed.host)
    } catch {
      return false
    }
  }

  return isAllowedUrl(origin) || isAllowedUrl(referer)
}

function isRateLimited(map: Map<string, number>, key: string, windowMs: number): boolean {
  pruneRateLimitMap(map, windowMs)
  const now = Date.now()
  const last = map.get(key)
  if (last && now - last < windowMs) return true
  map.set(key, now)
  return false
}

/**
 * Création de compte :
 * - chemin interne uniquement via secret serveur (recommandé)
 * - chemin public désactivé sauf CONTACT_ALLOW_PUBLIC_ACCOUNT_CREATION=true
 */
function canCreateAccountFromPublicRequest(request: Request, data: z.infer<typeof schema>): boolean {
  if (!data.createAccount) return false
  if (process.env.CONTACT_ALLOW_PUBLIC_ACCOUNT_CREATION !== 'true') return false

  if (data.website && data.website.trim().length > 0) return false
  if (!data.startedAt || Date.now() - data.startedAt < 3000) return false
  if (!isTrustedOrigin(request)) return false

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const emailKey = data.email.toLowerCase()
  if (isRateLimited(ipRateLimitMap, ip, ACCOUNT_CREATE_IP_WINDOW)) return false
  if (isRateLimited(emailRateLimitMap, emailKey, ACCOUNT_CREATE_EMAIL_WINDOW)) return false

  return true
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    // Honeypot : bloquer toute la requête (pas seulement la création de compte)
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ success: true })
    }

    if (!isTrustedOrigin(request)) {
      return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(contactIpRateLimitMap, `contact:${ip}`, CONTACT_IP_WINDOW)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const supabase = createAdminClient()

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

    const accountCreationSecret = process.env.CONTACT_ACCOUNT_CREATION_SECRET
    const providedSecret = request.headers.get('x-account-creation-secret')
    const internalAccountCreation = Boolean(
      data.createAccount &&
      accountCreationSecret &&
      providedSecret &&
      timingSafeEqualString(providedSecret, accountCreationSecret)
    )

    const publicAccountCreation = canCreateAccountFromPublicRequest(request, data)
    const canCreateAccount = internalAccountCreation || publicAccountCreation

    let accountCreated = false
    if (canCreateAccount) {
      accountCreated = await createClientAccount(supabase, data, request)
    } else if (data.createAccount) {
      console.warn('[contact] Account creation blocked by security checks')
    }

    try {
      await sendContactEmail(data)
    } catch (emailError) {
      console.error('[contact] Admin notification email error:', emailError)
    }

    return NextResponse.json({
      success: true,
      accountCreated: data.createAccount ? accountCreated : undefined,
    })
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
  data: { name: string; email: string; phone?: string },
  request: Request
): Promise<boolean> {
  const email = data.email.toLowerCase().trim()

  const { error: clientError } = await supabase.from('clients').upsert(
    [{ name: data.name, email, phone: data.phone || null }],
    { onConflict: 'email' }
  )
  if (clientError) {
    console.error('[contact] Client upsert error:', clientError)
  }

  const { error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: 'client' },
    user_metadata: { name: data.name },
  })

  if (authError) {
    console.log('[contact] User may already exist, generating new link anyway:', authError.message)
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError) {
    console.error('[contact] Magic link generation failed:', linkError)
    return false
  }

  const tokenHash = linkData?.properties?.hashed_token
  if (!tokenHash) {
    console.error('[contact] No hashed_token in generateLink response:', linkData)
    return false
  }

  // Garantir le claim client (comptes existants créés avant le durcissement RLS)
  const linkedUser = linkData.user
  if (linkedUser?.id && linkedUser.app_metadata?.role !== 'client') {
    const { error: metaErr } = await supabase.auth.admin.updateUserById(linkedUser.id, {
      app_metadata: { ...linkedUser.app_metadata, role: 'client' },
      user_metadata: { ...linkedUser.user_metadata, name: data.name },
    })
    if (metaErr) {
      console.warn('[contact] failed to sync client role:', metaErr.message)
    }
  }

  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://samez.fr'
      : `http://${request.headers.get('host') || 'localhost:3000'}`
  const inviteUrl = `${baseUrl}/espace-client/nouveau-mot-de-passe?token_hash=${tokenHash}&type=magiclink`

  try {
    await sendClientInviteEmail({
      name: data.name,
      email,
      inviteUrl,
    })
    console.log('[contact] Invite email sent to:', email)
    return true
  } catch (inviteEmailError) {
    console.error('[contact] Invite email send failed:', inviteEmailError)
    return false
  }
}
