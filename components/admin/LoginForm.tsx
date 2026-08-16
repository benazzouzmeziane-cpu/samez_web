'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthSplit from '@/components/client/AuthSplit'

const inputClass =
  'w-full px-4 py-3 border border-white/10 bg-[var(--navy)] text-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-[border-color] duration-[var(--duration-ui)] ease'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    const ensureRes = await fetch('/api/auth/ensure-admin', { method: 'POST' })
    const ensureData = await ensureRes.json().catch(() => ({ allowed: false }))

    if (!ensureRes.ok || !ensureData.allowed) {
      await supabase.auth.signOut()
      setError(ensureData.error || 'Ce compte n’est pas autorisé à accéder à l’administration.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AuthSplit
      eyebrow="Admin"
      title="Console"
      subtitle="Messages, pièces, rendez-vous et contenus — un seul endroit."
      brandTitle={
        <>
          La console,
          <br />
          pas un back-office.
        </>
      }
      brandBody="Ce qui attend une action, puis le reste. Rien de plus."
      points={['SEO versionné', 'Devis et factures', 'RDV et messages']}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className={inputClass}
            placeholder="contact@samez.fr"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </AuthSplit>
  )
}
