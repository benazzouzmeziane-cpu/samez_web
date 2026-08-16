'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSeoDocument } from '@/lib/seo/actions'
import { DOCUMENT_TYPES, type DocumentType } from '@/lib/seo/schema'
import { typeLabel } from '@/lib/seo/paths'

export default function CreateSeoForm() {
  const router = useRouter()
  const [type, setType] = useState<DocumentType>('service')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [silo, setSilo] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await createSeoDocument({ type, slug, title, silo: silo || undefined })
      router.push(`/admin/seo/${result.documentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as DocumentType)}
          className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
        >
          {DOCUMENT_TYPES.map(item => (
            <option key={item} value={item}>
              {typeLabel(item)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Titre</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Slug</label>
        <input
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="automatisation-n8n"
          className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Silo / thème</label>
        <input
          value={silo}
          onChange={e => setSilo(e.target.value)}
          placeholder="automatisation"
          className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg disabled:opacity-50"
      >
        {saving ? 'Création…' : 'Créer le brouillon'}
      </button>
    </form>
  )
}
