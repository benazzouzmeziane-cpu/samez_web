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

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'forgot' ? 'Mot de passe oublié' : 'Espace client'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'forgot'
              ? 'Recevez un lien pour réinitialiser votre mot de passe'
              : 'Connectez-vous pour suivre vos documents'}
          </p>
        </div>

        {mode === 'forgot' && forgotSent ? (
          <div className="p-5 bg-[var(--accent-light)] rounded-xl text-center">
            <svg className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-[var(--accent-dark)]">Si un compte existe, un email a été envoyé.</p>
            <p className="text-xs text-[var(--accent)] mt-1">
              Vérifiez votre boîte mail (et les indésirables).
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setForgotSent(false)
                setError('')
              }}
              className="mt-4 text-xs text-[var(--accent)] hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className="w-full text-xs text-gray-500 hover:text-[var(--accent)] transition-colors"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-500">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setError('')
                    setForgotSent(false)
                  }}
                  className="text-xs text-[var(--accent)] hover:underline"
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
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        )}

        <div className="mt-8 p-4 bg-[#fafafa] rounded-xl border border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Pas encore de compte ? Contactez-nous via le{' '}
            <Link href="/#contact" className="text-[var(--accent)] hover:underline">formulaire</Link>
            {' '}ou à{' '}
            <a href="mailto:contact@samez.fr" className="text-[var(--accent)] hover:underline">contact@samez.fr</a>
            {' '}— nous créerons votre accès.
          </p>
        </div>
      </div>
    </main>
  )
}
