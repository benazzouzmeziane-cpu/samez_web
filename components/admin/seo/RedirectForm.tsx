'use client'

import { useState } from 'react'
import { createRedirect } from '@/lib/seo/actions'

export default function RedirectForm() {
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  return (
    <form
      className="flex flex-wrap gap-3 items-end"
      onSubmit={async event => {
        event.preventDefault()
        setError('')
        setOk(false)
        try {
          await createRedirect(fromPath, toPath)
          setOk(true)
          setFromPath('')
          setToPath('')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Impossible')
        }
      }}
    >
      <label className="text-sm">
        <span className="block text-xs text-gray-500 mb-1">Depuis</span>
        <input
          value={fromPath}
          onChange={e => setFromPath(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="/ancien-slug"
        />
      </label>
      <label className="text-sm">
        <span className="block text-xs text-gray-500 mb-1">Vers</span>
        <input
          value={toPath}
          onChange={e => setToPath(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="/nouveau"
        />
      </label>
      <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg">
        Ajouter
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Redirection enregistrée</p> : null}
    </form>
  )
}
