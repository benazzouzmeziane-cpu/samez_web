'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type RealisationData = {
  id?: string
  title: string
  description: string
  image_url: string
  link: string
  order: number
  published: boolean
}

type Props = {
  realisation?: RealisationData
  mode: 'create' | 'edit'
}

export default function RealisationForm({ realisation, mode }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(realisation?.title ?? '')
  const [description, setDescription] = useState(realisation?.description ?? '')
  const [imageUrl, setImageUrl] = useState(realisation?.image_url ?? '')
  const [link, setLink] = useState(realisation?.link ?? '')
  const [order, setOrder] = useState(realisation?.order ?? 0)
  const [published, setPublished] = useState(realisation?.published ?? true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('realisations')
      .upload(fileName, file, { upsert: true })

    if (uploadErr) {
      setError('Erreur lors de l\'upload de l\'image.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('realisations')
      .getPublicUrl(fileName)

    setImageUrl(publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    if (!title.trim() || !description.trim() || !link.trim()) {
      setError('Titre, description et lien sont requis.')
      setSaving(false)
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      link: link.trim(),
      order,
      published,
    }

    try {
      if (mode === 'create') {
        const { data, error: err } = await supabase
          .from('realisations')
          .insert([payload])
          .select('id')
          .single()

        if (err || !data) {
          setError('Erreur lors de la création.')
          setSaving(false)
          return
        }
        router.push(`/admin/realisations/${data.id}`)
      } else {
        const { error: err } = await supabase
          .from('realisations')
          .update(payload)
          .eq('id', realisation!.id!)

        if (err) {
          setError('Erreur lors de la mise à jour.')
          setSaving(false)
          return
        }
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!realisation?.id) return
    setDeleting(true)
    setError('')

    try {
      const { error: err } = await supabase
        .from('realisations')
        .delete()
        .eq('id', realisation.id)

      if (err) {
        setError('Erreur lors de la suppression.')
        setDeleting(false)
        return
      }
      router.push('/admin/realisations')
    } catch {
      setError('Erreur lors de la suppression.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Modale de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Supprimer cette réalisation ?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{realisation?.title}</strong> sera définitivement supprimée. Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infos principales */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Informations</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Application de gestion logistique"
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Courte description du projet..."
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Média & lien */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Média & Lien</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Image *</label>
            <div className="flex items-start gap-4">
              {imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <label className="cursor-pointer">
                <div className={`px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-center ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  {uploading ? 'Upload en cours...' : imageUrl ? 'Changer l\'image' : 'Choisir une image'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Lien externe *</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://mon-projet.com"
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Options</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ordre d&apos;affichage</label>
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded"
              />
              <span className="text-sm text-gray-600">Publié</span>
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Annuler
          </button>
        </div>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
