'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EmailOtpType } from '@supabase/supabase-js'
import AuthSplit from '@/components/client/AuthSplit'

type PageState = 'loading' | 'ready' | 'expired' | 'success'

const inputClass =
  'w-full px-4 py-3 border border-white/10 bg-[var(--navy)] text-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-[border-color] duration-[var(--duration-ui)] ease'

function PasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [error, setError] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const isRecovery = searchParams.get('type') === 'recovery'

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!tokenHash || !type) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        setPageState(user ? 'ready' : 'expired')
      })
      return
    }

    const otpType = (type === 'recovery' ? 'recovery' : 'magiclink') as EmailOtpType
    const supabase = createClient()
    supabase.auth
      .verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      })
      .then(({ error: otpError }) => {
        if (otpError) {
          console.error('OTP verification error:', otpError.message)
          setPageState('expired')
        } else {
          setPageState('ready')
        }
      })
  }, [searchParams])

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
    const { error: updateError } = await supabase.auth.updateUser({ password })

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
    setError('')

    try {
      const endpoint = isRecovery ? '/api/auth/forgot-password' : '/api/auth/resend-invite'
      const res = await fetch(endpoint, {
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

  if (pageState === 'loading') {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Vérification du lien...</p>
        </div>
      </main>
    )
  }

  if (pageState === 'expired') {
    return (
      <AuthSplit
        title="Lien expiré"
        subtitle={`Ce lien n’est plus valide. Demandez un nouveau lien${
          isRecovery ? ' de réinitialisation' : ' pour créer votre mot de passe'
        }.`}
      >
        {resendSuccess ? (
          <div className="py-6 border-y border-white/10">
            <p className="font-display text-lg font-semibold mb-2">Email envoyé</p>
            <p className="text-sm text-slate-400">Consultez votre boîte mail pour le nouveau lien.</p>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-3">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              className={inputClass}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={resending} className="btn btn-primary w-full disabled:opacity-50">
              {resending ? 'Envoi...' : 'Renvoyer le lien'}
            </button>
          </form>
        )}
        <p className="text-xs text-slate-500 mt-8">
          Vous avez déjà un mot de passe ?{' '}
          <a href="/espace-client" className="text-[var(--accent)] underline underline-offset-2">
            Se connecter
          </a>
        </p>
      </AuthSplit>
    )
  }

  return (
    <AuthSplit
      title={isRecovery ? 'Nouveau mot de passe' : 'Créez votre mot de passe'}
      subtitle={
        isRecovery
          ? 'Choisissez un nouveau mot de passe pour votre espace.'
          : 'Choisissez un mot de passe sécurisé pour accéder à votre espace.'
      }
    >
      {pageState === 'success' ? (
        <div className="py-6 border-y border-white/10">
          <p className="font-display text-lg font-semibold mb-2">
            {isRecovery ? 'Mot de passe mis à jour' : 'Mot de passe créé'}
          </p>
          <p className="text-sm text-slate-400">Redirection vers votre espace...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
            {loading ? 'Enregistrement...' : isRecovery ? 'Enregistrer' : 'Créer mon mot de passe'}
          </button>
        </form>
      )}
      <p className="text-xs text-slate-500 mt-8">
        Besoin d&apos;aide ?{' '}
        <a href="mailto:contact@samez.fr" className="text-[var(--accent)] underline underline-offset-2">
          contact@samez.fr
        </a>
      </p>
    </AuthSplit>
  )
}

export default function NouveauMotDePassePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PasswordForm />
    </Suspense>
  )
}
