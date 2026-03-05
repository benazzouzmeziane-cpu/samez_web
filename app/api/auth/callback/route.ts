import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeNextPath(nextParam: string | null): string {
  if (!nextParam) return '/espace-client/dashboard'

  // Autoriser uniquement les chemins relatifs internes.
  if (!nextParam.startsWith('/')) return '/espace-client/dashboard'
  if (nextParam.startsWith('//')) return '/espace-client/dashboard'
  if (nextParam.includes('://')) return '/espace-client/dashboard'

  return nextParam
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // En cas d'erreur, rediriger vers la page de connexion
  return NextResponse.redirect(new URL('/espace-client?error=auth', request.url))
}
