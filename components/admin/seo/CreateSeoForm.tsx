'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyGeneratedDraft, createSeoDocument } from '@/lib/seo/actions'
import { generatedToVersionInput } from '@/lib/seo/from-generated'
import { readApiJson, waitForSeoGeneration } from '@/lib/seo/http'
import { documentPath, slugify, typeLabel } from '@/lib/seo/paths'
import {
  DOCUMENT_TYPES,
  SEARCH_INTENTS,
  type DocumentType,
  type GeneratedDocument,
  type SearchIntent,
  type SourceItem,
} from '@/lib/seo/schema'

const INTENT_LABELS: Record<SearchIntent, string> = {
  informational: 'S’informer',
  commercial: 'Comparer une offre',
  transactional: 'Passer à l’action',
  navigational: 'Trouver same’z',
}

const DEFAULT_PROOFS =
  'Linqio (app live), Macarte Imprimée (agents fiches/SEO), Univercarte (refonte + automatisations).'

const inputClass =
  'w-full px-3 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg text-[var(--navy)]'

export type CreateSeoInitialValues = {
  type?: DocumentType
  title?: string
  slug?: string
  keyword?: string
  intent?: SearchIntent
  audience?: string
  brief?: string
  proofs?: string
  angle?: string
  sources?: SourceItem[]
}

export default function CreateSeoForm({
  initialValues = {},
  defaultProofs = DEFAULT_PROOFS,
}: {
  initialValues?: CreateSeoInitialValues
  defaultProofs?: string
}) {
  const router = useRouter()
  const [type, setType] = useState<DocumentType>(initialValues.type || 'service')
  const [title, setTitle] = useState(initialValues.title || '')
  const [slug, setSlug] = useState(initialValues.slug || '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug))
  const [keyword, setKeyword] = useState(initialValues.keyword || '')
  const [intent, setIntent] = useState<SearchIntent>(initialValues.intent || 'commercial')
  const [audience, setAudience] = useState(
    initialValues.audience || 'Dirigeants de TPE/PME et porteurs de projet'
  )
  const [brief, setBrief] = useState(initialValues.brief || '')
  const [proofs, setProofs] = useState(initialValues.proofs || defaultProofs)
  const [angle, setAngle] = useState(initialValues.angle || '')
  const [sourceText, setSourceText] = useState(
    (initialValues.sources || []).map(source => `${source.label} | ${source.url || ''}`).join('\n')
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const derivedSlug = useMemo(() => slugify(slug || title || keyword), [slug, title, keyword])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const nextSlug = derivedSlug
      if (nextSlug.length < 2) throw new Error('Indiquez un titre, un mot-clé ou un slug')
      const nextTitle = title.trim() || keyword.trim() || nextSlug
      const created = await createSeoDocument({
        type,
        slug: nextSlug,
        title: nextTitle,
        silo: (keyword.trim() || nextTitle).slice(0, 60),
      })

      const response = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: created.documentId,
          type,
          slug: nextSlug,
          title: nextTitle,
          brief,
          keywordPrimary: keyword.trim() || nextTitle,
          searchIntent: intent,
          audience,
          proofs,
          sources: sourceText
            .split('\n')
            .map(line => {
              const [label, ...urlParts] = line.split('|')
              return { label: label.trim(), url: urlParts.join('|').trim() }
            })
            .filter(source => source.label.length >= 2),
          angle: angle || undefined,
          ctaHref: '/reserver',
          ctaLabel: 'Réserver 45 min',
        }),
      })
      const started = await readApiJson<{ error?: string; runId?: string; document?: GeneratedDocument }>(
        response
      )
      if (!response.ok) {
        router.push(`/admin/seo/${created.documentId}`)
        throw new Error(started.error || 'Page créée, mais la génération a échoué. Complétez le brief dans l’éditeur.')
      }
      const json = started.document
        ? started
        : started.runId
          ? await waitForSeoGeneration<GeneratedDocument>(started.runId)
          : started
      const generated = json.document
      if (!generated) {
        router.push(`/admin/seo/${created.documentId}`)
        throw new Error('Page créée, mais la génération a renvoyé une réponse vide.')
      }
      const next = generatedToVersionInput(generated, {
        slug: nextSlug,
        canonicalPath: documentPath(type, nextSlug),
      })
      await applyGeneratedDraft(created.documentId, created.versionId, next, true)
      router.push(`/admin/seo/${created.documentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
        <p className="text-sm font-semibold text-[var(--navy)]">Consigne pour l’agent</p>
        <p className="text-sm text-slate-500">
          Décrivez la page à rédiger. L’agent prépare un brouillon. Rien n’est publié tant que vous n’avez pas relu.
        </p>
        <textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          required
          minLength={20}
          placeholder="Exemple : page offre automatisation n8n pour TPE. Expliquer la différence avec un Zapier jetable, citer Macarte Imprimée, terminer par un appel à réserver 45 min."
          className={`${inputClass} min-h-40`}
        />
        <p className="text-xs text-slate-400">{brief.trim().length}/20 caractères minimum</p>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Type de page</span>
          <select
            value={type}
            onChange={e => setType(e.target.value as DocumentType)}
            className={inputClass}
          >
            {DOCUMENT_TYPES.map(item => (
              <option key={item} value={item}>
                {typeLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Intention de recherche</span>
          <select
            value={intent}
            onChange={e => setIntent(e.target.value as SearchIntent)}
            className={inputClass}
          >
            {SEARCH_INTENTS.map(item => (
              <option key={item} value={item}>
                {INTENT_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Mot-clé principal</span>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="agence n8n"
            className={inputClass}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Titre interne (optionnel)</span>
          <input
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            placeholder="Automatisation n8n sur mesure"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">URL (slug)</span>
          <input
            value={slugTouched ? slug : derivedSlug}
            onChange={e => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="automatisation-n8n"
            className={inputClass}
          />
          <span className="text-xs text-slate-400 mt-1 block">{documentPath(type, derivedSlug || '…')}</span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Audience</span>
          <input
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Preuves same’z (uniquement des faits vrais)</span>
          <textarea
            value={proofs}
            onChange={e => setProofs(e.target.value)}
            className={`${inputClass} min-h-20`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Angle (optionnel)</span>
          <input
            value={angle}
            onChange={e => setAngle(e.target.value)}
            placeholder="Pas un tutoriel n8n : un système qui tient en production"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">
            Sources de recherche (libellé | URL)
          </span>
          <textarea
            value={sourceText}
            onChange={event => setSourceText(event.target.value)}
            className={`${inputClass} min-h-24`}
            placeholder="Concurrent consulté | https://exemple.fr/page"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button type="submit" disabled={saving || brief.trim().length < 20} className="btn btn-primary !py-2.5 !px-5">
        {saving ? 'L’agent rédige…' : 'Demander à l’agent de rédiger'}
      </button>
    </form>
  )
}
