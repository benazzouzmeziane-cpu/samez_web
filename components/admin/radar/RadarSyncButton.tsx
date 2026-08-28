'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RadarSyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function sync() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/radar/sync', { method: 'POST' })
      const json = (await response.json()) as {
        error?: string
        summary?: { fetched: number; kept: number; scored: number }
      }
      if (!response.ok) throw new Error(json.error || 'Synchronisation impossible')
      setMessage(
        `Sync OK — ${json.summary?.fetched ?? 0} lus, ${json.summary?.kept ?? 0} retenus, ${json.summary?.scored ?? 0} scorés IA.`
      )
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Synchronisation impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" disabled={loading} onClick={sync} className="btn btn-primary !py-2.5 !px-4 disabled:opacity-50">
        {loading ? 'Analyse…' : 'Lancer le radar'}
      </button>
      {message ? <p className="text-xs text-emerald-700 max-w-xs text-right">{message}</p> : null}
      {error ? <p className="text-xs text-red-600 max-w-xs text-right">{error}</p> : null}
    </div>
  )
}
