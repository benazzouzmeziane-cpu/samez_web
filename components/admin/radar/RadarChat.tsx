'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { RadarConversation, RadarMessage } from '@/lib/radar/store'

const PROMPTS = [
  { label: 'Agences immo Paris', text: 'Cherche les agences immobilières créées récemment à Paris, SAS ou SARL' },
  { label: 'Marchés site web IDF', text: 'Cherche les marchés publics site internet en Île-de-France' },
  { label: 'Cabinets comptables', text: 'Cherche les cabinets comptables créés cette semaine hors NAF 62' },
  { label: 'Artisans bâtiment', text: 'Cherche les artisans du bâtiment (plomberie, électricité) en création récente' },
]

function IconCompose({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconTrash({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M9 7V5h6v2m-8 0l.8 12h8.4l.8-12" />
    </svg>
  )
}

function IconSend({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function hrefFor(listQuery: string, conversationId: string | null) {
  const params = new URLSearchParams(listQuery)
  if (conversationId) params.set('c', conversationId)
  else params.delete('c')
  const value = params.toString()
  return value ? `/admin/radar?${value}` : '/admin/radar'
}

export default function RadarChat({
  conversations,
  conversationId,
  initialMessages,
  listQuery,
}: {
  conversations: RadarConversation[]
  conversationId: string | null
  initialMessages: RadarMessage[]
  listQuery: string
}) {
  const router = useRouter()
  const endRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threads, setThreads] = useState(conversations)

  useEffect(() => {
    setMessages(initialMessages)
  }, [conversationId, initialMessages])

  useEffect(() => {
    setThreads(conversations)
  }, [conversations])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, loading])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return threads
    return threads.filter(item => item.title.toLowerCase().includes(needle))
  }, [threads, query])

  async function send(message: string) {
    const content = message.trim()
    if (!content || loading) return
    setLoading(true)
    setError(null)
    setText('')
    setMessages(current => [
      ...current,
      {
        id: `local-${Date.now()}`,
        conversation_id: conversationId ?? '',
        role: 'user',
        content,
        brief: null,
        created_at: new Date().toISOString(),
      },
    ])
    try {
      const response = await fetch('/api/admin/radar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId }),
      })
      const json = (await response.json()) as {
        error?: string
        reply?: string
        conversationId?: string
        title?: string
      }
      if (!response.ok) throw new Error(json.error || 'Réponse impossible')
      const nextId = json.conversationId || conversationId
      setMessages(current => [
        ...current,
        {
          id: `asst-${Date.now()}`,
          conversation_id: nextId ?? '',
          role: 'assistant',
          content: json.reply || '',
          brief: null,
          created_at: new Date().toISOString(),
        },
      ])
      if (nextId && json.title) {
        setThreads(current => {
          const rest = current.filter(item => item.id !== nextId)
          return [
            { id: nextId, title: json.title || content, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ...rest,
          ]
        })
      }
      if (nextId && nextId !== conversationId) {
        router.replace(hrefFor(listQuery, nextId))
      }
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Discussion impossible')
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/admin/radar/conversations/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const json = (await response.json()) as { error?: string }
      setError(json.error || 'Suppression impossible')
      return
    }
    setThreads(current => current.filter(item => item.id !== id))
    if (id === conversationId) {
      setMessages([])
      router.replace(hrefFor(listQuery, null))
    } else router.refresh()
  }

  const empty = messages.length === 0 && !loading

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white mb-6 overflow-hidden grid md:grid-cols-[220px_minmax(0,1fr)] min-h-[28rem] md:h-[min(72vh,38rem)]">
      <aside className="border-b md:border-b-0 md:border-r border-black/[0.06] bg-slate-50/80 flex flex-col min-h-0 max-md:max-h-48">
        <div className="p-3 space-y-2">
          <Link
            href={hrefFor(listQuery, null)}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--navy)] text-white text-sm font-medium py-2.5 active:scale-[0.97] transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)]"
          >
            <IconCompose />
            Nouveau chat
          </Link>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Rechercher un fil…"
            className="w-full px-2.5 py-2 rounded-lg border border-black/[0.08] bg-white text-sm outline-none focus:border-[var(--accent-dark)]"
          />
        </div>
        <p className="px-3 pt-1 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Récents</p>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 min-h-0">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-400">Aucun fil pour l’instant.</p>
          ) : (
            filtered.map(item => {
              const active = item.id === conversationId
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-1 rounded-lg ${
                    active ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                  }`}
                >
                  <Link
                    href={hrefFor(listQuery, item.id)}
                    className={`flex-1 min-w-0 px-2.5 py-2 text-[13px] truncate ${
                      active ? 'text-[var(--navy)] font-medium' : 'text-slate-600'
                    }`}
                  >
                    {item.title}
                  </Link>
                  <button
                    type="button"
                    aria-label="Supprimer le fil"
                    onClick={() => remove(item.id)}
                    className="opacity-70 md:opacity-0 md:group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-opacity duration-150 ease-[var(--ease-out)]"
                  >
                    <IconTrash />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      <div className="flex flex-col min-h-[22rem] md:min-h-0 min-w-0">
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {empty ? (
            <div className="h-full min-h-[16rem] flex flex-col items-center justify-center text-center px-2">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--navy)]">
                Que voulez-vous chercher ?
              </p>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Un fil par recherche. Rien n’est envoyé au prospect. Les pistes restent en dessous.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-xl">
                {PROMPTS.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => send(item.text)}
                    className="rounded-xl border border-black/[0.08] bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 hover:border-[var(--navy)]/20 hover:bg-white active:scale-[0.98] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(item => (
                <div key={item.id} className={item.role === 'user' ? 'text-right' : ''}>
                  <p
                    className={`inline-block max-w-[90%] text-sm whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                      item.role === 'user' ? 'bg-[var(--navy)] text-white text-left' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.content}
                  </p>
                </div>
              ))}
              {loading ? <p className="text-xs text-slate-400">L’agent cherche et répond…</p> : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={event => {
            event.preventDefault()
            void send(text)
          }}
          className="p-4 pt-2"
        >
          <div className="flex gap-2 items-end rounded-xl border border-black/[0.08] bg-slate-50/80 px-3 py-2 focus-within:border-[var(--accent-dark)] focus-within:bg-white">
            <textarea
              value={text}
              onChange={event => setText(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send(text)
                }
              }}
              rows={1}
              placeholder="Que voulez-vous chercher ?"
              className="flex-1 resize-none bg-transparent text-sm py-2 outline-none max-h-32"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              aria-label="Envoyer"
              className="btn btn-primary !py-2 !px-3 disabled:opacity-50"
            >
              <IconSend />
            </button>
          </div>
          {error ? <p className="text-xs text-red-600 mt-2">{error}</p> : null}
        </form>
      </div>
    </section>
  )
}
