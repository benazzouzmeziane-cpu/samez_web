'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PageState = 'loading' | 'ready' | 'expired' | 'success'

export default function NouveauMotDePassePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [error, setError] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Vérifier le hash pour détecter les erreurs ou les tokens
  const checkHash = useCallback(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash.substring(1)
    if (!hash) return false

    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code')

    if (errorCode === 'otp_expired' || params.get('error') === 'access_denied') {
      setPageState('expired')
      return true
    }

    return false
  }, [])

  useEffect(() => {
    // D'abord vérifier le hash pour les erreurs
    const hasError = checkHash()
    if (hasError) return

    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      } else if (event === 'SIGNED_IN') {
        setPageState('ready')
      }
    })

    // Vérifier si déjà authentifié
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setPageState('ready')
      } else {
        // Laisser le temps au hash d'être traité
        setTimeout(() => {
          setPageState(prev => {
            if (prev === 'loading') return 'expired'
            return prev
          })
        }, 4000)
      }
    })

    return () => subscription.unsubscribe()
  }, [checkHash])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.')
      setLoading(false)
      return
    }

    setPageState('success')
    setTimeout(() => {
      router.push('/espace-client/dashboard')
    }, 2000)
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return
    setResending(true)

    try {
      const res = await fetch('/api/auth/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })

      if (res.ok) {
        setResendSuccess(true)
      } else {
        setError('Impossible de renvoyer le lien. Vérifiez votre email.')
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setResending(false)
    }
  }

  // État : chargement
  if (pageState === 'loading') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Vérification du lien...</p>
        </div>
      </main>
    )
  }

  // État : lien expiré
  if (pageState === 'expired') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Lien expiré</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ce lien n&apos;est plus valide. Demandez un nouveau lien pour créer votre mot de passe.
          </p>

          {resendSuccess ? (
            <div className="p-4 bg-[var(--accent-light)] rounded-xl">
              <svg className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-[var(--accent-dark)]">Email envoyé !</p>
              <p className="text-xs text-[var(--accent)] mt-1">Consultez votre boîte mail pour le nouveau lien.</p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors text-center"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={resending}
                className="w-full py-3 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
              >
                {resending ? 'Envoi...' : 'Renvoyer le lien'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 mt-6">
            Vous avez déjà un mot de passe ?{' '}
            <a href="/espace-client" className="text-[var(--accent)] hover:underline">Se connecter</a>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Créez votre mot de passe</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez un mot de passe sécurisé pour accéder à votre espace</p>
        </div>

        {pageState === 'success' ? (
          <div className="text-center p-6 bg-[var(--accent-light)] rounded-xl">
            <svg className="w-10 h-10 text-[var(--accent)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-[var(--accent-dark)]">Mot de passe créé avec succès !</p>
            <p className="text-xs text-[var(--accent)] mt-1">Redirection vers votre espace...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Créer mon mot de passe'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Besoin d&apos;aide ?{' '}
            <a href="mailto:contact@samez.fr" className="text-[var(--accent)] hover:underline">contact@samez.fr</a>
          </p>
        </div>
      </div>
    </main>
  )
}
