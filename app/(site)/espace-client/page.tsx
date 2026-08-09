'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'forgot'

export default function EspaceClientPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    const role = data.user?.app_metadata?.role
    if (role === 'admin') {
      router.push('/admin')
      return
    }
    if (role !== 'client') {
      await supabase.auth.signOut()
      setError('Ce compte n’a pas accès à l’espace client.')
      setLoading(false)
      return
    }

    router.push('/espace-client/dashboard')
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setError('Trop de demandes. Réessayez dans quelques minutes.')
        } else {
          setError(data.error || 'Impossible d’envoyer le lien. Réessayez.')
        }
        setLoading(false)
        return
      }

      setForgotSent(true)
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-[border-color] duration-[var(--duration-ui)] ease'

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24 relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-3">
            Compte
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {mode === 'forgot' ? 'Mot de passe oublié' : 'Espace client'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {mode === 'forgot'
              ? 'Recevez un lien pour réinitialiser votre mot de passe'
              : 'Connectez-vous pour suivre vos documents'}
          </p>
        </div>

        {mode === 'forgot' && forgotSent ? (
          <div className="py-6 border-y border-black/[0.06]">
            <p className="font-display text-lg font-semibold mb-2">Email envoyé</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Si un compte existe, un email a été envoyé. Vérifiez aussi vos indésirables.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setForgotSent(false)
                setError('')
              }}
              className="mt-4 text-sm text-[var(--accent)] underline underline-offset-2"
            >
              Retour à la connexion
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                autoFocus
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className="w-full text-sm text-gray-500 link-quiet"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                className={inputClass}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setError('')
                    setForgotSent(false)
                  }}
                  className="text-xs text-[var(--accent)] underline underline-offset-2"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-black/[0.06] space-y-3">
          <p className="font-display text-base font-semibold tracking-tight">Pas encore de compte ?</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Créez votre accès en 1 minute : vous recevrez un email pour définir votre mot de passe.
          </p>
          <Link href="/#contact?compte=1" className="btn btn-secondary w-full">
            Créer mon compte
          </Link>
        </div>
      </div>
    </main>
  )
}
