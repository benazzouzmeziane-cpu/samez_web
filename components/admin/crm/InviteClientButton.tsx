'use client'

import { useState } from 'react'

export default function InviteClientButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  const onClick = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/auth/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? 'ok' : 'err')
    } catch {
      setState('err')
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'loading' || state === 'ok'}
      className="client-press text-xs px-3 py-1.5 rounded-full border border-black/10 text-slate-600 disabled:opacity-50"
    >
      {state === 'loading' ? 'Envoi…' : state === 'ok' ? 'Invitation envoyée' : 'Inviter à l’espace'}
    </button>
  )
}
