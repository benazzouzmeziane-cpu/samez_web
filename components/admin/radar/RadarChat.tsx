'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RadarMessage } from '@/lib/radar/store'

export default function RadarChat({ initialMessages }: { initialMessages: RadarMessage[] }) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(event: React.FormEvent) {
    event.preventDefault()
    const message = text.trim()
    if (!message || loading) return
    setLoading(true)
    setError(null)
    setText('')
    setMessages(current => [
      ...current,
      { id: `local-${Date.now()}`, role: 'user', content: message, brief: null, created_at: new Date().toISOString() },
    ])
    try {
      const response = await fetch('/api/admin/radar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const json = (await response.json()) as { error?: string; reply?: string }
      if (!response.ok) throw new Error(json.error || 'Réponse impossible')
      setMessages(current => [
        ...current,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: json.reply || '',
          brief: null,
          created_at: new Date().toISOString(),
        },
      ])
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Discussion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 mb-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-1">Agent radar</p>
      <p className="text-sm text-slate-500 mb-4">
        Dites-lui quoi chercher, ou discutez d’une piste avant d’ouvrir une fiche. Rien n’est envoyé au prospect.
      </p>
      <div className="max-h-72 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">
            Ex. « Cherche les agences immo à Paris, SAS » · « Marchés site internet en IDF » · « Pourquoi OFFIMEMO est un Go ? »
          </p>
        ) : (
          messages.map(item => (
            <div key={item.id} className={item.role === 'user' ? 'text-right' : ''}>
              <p
                className={`inline-block max-w-[90%] text-sm whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                  item.role === 'user' ? 'bg-[var(--navy)] text-white text-left' : 'bg-slate-50 text-slate-700'
                }`}
              >
                {item.content}
              </p>
            </div>
          ))
        )}
        {loading ? <p className="text-xs text-slate-400">L’agent cherche et répond…</p> : null}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Cherche… ou pose une question sur les résultats"
          className="flex-1 px-3 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent-dark)]"
        />
        <button type="submit" disabled={loading || !text.trim()} className="btn btn-primary !py-2.5 !px-4 disabled:opacity-50">
          Envoyer
        </button>
      </form>
      {error ? <p className="text-xs text-red-600 mt-2">{error}</p> : null}
    </section>
  )
}
