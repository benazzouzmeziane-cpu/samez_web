'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  applyGeneratedDraft,
  publishSeoVersion,
  registerSeoMedia,
  replaceInternalLinks,
  restoreSeoVersion,
  saveSeoVersion,
  scheduleSeoVersion,
  setSeoStatus,
} from '@/lib/seo/actions'
import { buildChecklist, canPublish } from '@/lib/seo/checklist'
import { generatedToVersionInput } from '@/lib/seo/from-generated'
import { documentPath, typeLabel } from '@/lib/seo/paths'
import { readApiJson, waitForSeoGeneration } from '@/lib/seo/http'
import {
  BLOCK_TYPES,
  SEARCH_INTENTS,
  versionInputSchema,
  type ContentBlock,
  type GeneratedDocument,
  type SearchIntent,
  type VersionInput,
} from '@/lib/seo/schema'
import type { SeoDocument, SeoDocumentVersion } from '@/lib/seo/types'
import { createBlock } from './block-defaults'

type LinkRow = {
  targetDocumentId: string
  anchorText: string
  approved: boolean
}

type IncomingLink = { anchor: string; slug: string }
type Suggestion = { id: string; slug: string }

type Props = {
  document: SeoDocument
  version: SeoDocumentVersion
  versions: SeoDocumentVersion[]
  documents: SeoDocument[]
  links: LinkRow[]
  incoming: IncomingLink[]
  suggestions: Suggestion[]
}

const TABS = ['Agent', 'Contenu', 'SEO', 'GEO', 'Maillage', 'Données', 'Publication', 'Historique'] as const

function versionToInput(document: SeoDocument, version: SeoDocumentVersion): VersionInput {
  return {
    title: version.title,
    h1: version.h1,
    excerpt: version.excerpt,
    metaTitle: version.meta_title || version.title.slice(0, 70),
    metaDescription:
      version.meta_description ||
      'À compléter : décrivez clairement le problème, la solution same’z et l’action suivante.',
    canonicalPath: version.canonical_path || documentPath(document.type, version.target_slug || document.slug),
    ogImageUrl: version.og_image_url,
    ogTitle: version.og_title,
    ogDescription: version.og_description,
    robotsIndex: version.robots_index,
    robotsFollow: version.robots_follow,
    keywordPrimary: version.keyword_primary,
    searchIntent: (version.search_intent as SearchIntent | null) ?? null,
    audience: version.audience,
    entities: version.entities,
    factualSummary: version.factual_summary,
    geoLocality: version.geo_locality,
    geoRegion: version.geo_region,
    blocks: version.blocks,
    faq: version.faq,
    sources: version.sources,
    extraJsonLd:
      version.extra_json_ld && typeof version.extra_json_ld['@type'] === 'string'
        ? (version.extra_json_ld as VersionInput['extraJsonLd'])
        : null,
    ctaLabel: version.cta_label,
    ctaHref: version.cta_href,
    authorName: version.author_name,
    humanReviewed: version.human_reviewed,
    reviewNotes: version.review_notes,
    isIndexable: document.is_indexable,
    silo: document.silo,
    slug: version.target_slug || document.slug,
  }
}

export default function SeoDocumentEditor({
  document,
  version,
  versions,
  documents,
  links: initialLinks,
  incoming,
  suggestions,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Agent')
  const [form, setForm] = useState<VersionInput>(() => versionToInput(document, version))
  const [links, setLinks] = useState<LinkRow[]>(initialLinks)
  const [versionId, setVersionId] = useState(version.id)
  const [status, setStatus] = useState(version.status)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [brief, setBrief] = useState('')
  const [proofs, setProofs] = useState(
    'Linqio (app live), Macarte Imprimée (agents fiches/SEO), Univercarte (refonte + automatisations).'
  )
  const [angle, setAngle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [reviewFlags, setReviewFlags] = useState<string[]>([])
  const [scheduleAt, setScheduleAt] = useState('')
  const [jsonLdText, setJsonLdText] = useState(
    version.extra_json_ld ? JSON.stringify(version.extra_json_ld, null, 2) : ''
  )

  const checklist = useMemo(() => buildChecklist(form), [form])
  const publishReady = canPublish(checklist)

  function update<K extends keyof VersionInput>(key: K, value: VersionInput[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function updateBlock(index: number, block: ContentBlock) {
    setForm(current => ({
      ...current,
      blocks: current.blocks.map((item, i) => (i === index ? block : item)),
    }))
  }

  async function persist(next: VersionInput = form) {
    const parsed = versionInputSchema.safeParse(next)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Formulaire invalide')
    }
    const result = await saveSeoVersion(document.id, versionId, parsed.data)
    setVersionId(result.versionId)
    if (result.forked) setStatus('draft')
    return result
  }

  async function onSave() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      let extra = form.extraJsonLd
      if (jsonLdText.trim()) extra = JSON.parse(jsonLdText)
      const next = { ...form, extraJsonLd: extra }
      setForm(next)
      const result = await persist(next)
      await replaceInternalLinks(
        result.versionId,
        links.filter(link => link.targetDocumentId && link.anchorText)
      )
      setMessage('Brouillon enregistré')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function onGenerate() {
    setGenerating(true)
    setError('')
    try {
      const response = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          type: document.type,
          slug: form.slug,
          title: form.title,
          brief,
          keywordPrimary: form.keywordPrimary || form.title,
          searchIntent: form.searchIntent || 'commercial',
          audience: form.audience || 'PME et indépendants',
          proofs,
          angle: angle || undefined,
          sources: form.sources,
          ctaHref: form.ctaHref || '/reserver',
          ctaLabel: form.ctaLabel || 'Réserver 45 min',
        }),
      })
      const started = await readApiJson<{
        error?: string
        runId?: string
        document?: GeneratedDocument
        model?: string
        reviewFlags?: string[]
      }>(response)
      if (!response.ok) throw new Error(started.error || 'Génération impossible')
      const json = started.document
        ? started
        : started.runId
          ? await waitForSeoGeneration<GeneratedDocument>(started.runId)
          : started
      const generated = json.document
      if (!generated) throw new Error('Réponse IA incomplète')
      const next = {
        ...generatedToVersionInput(generated, {
          slug: form.slug,
          canonicalPath: documentPath(document.type, form.slug),
        }),
        silo: form.silo,
        isIndexable: form.isIndexable,
      }
      const result = await applyGeneratedDraft(document.id, versionId, next, true)
      setVersionId(result.versionId)
      setStatus('draft')
      setForm(next)
      setReviewFlags(generated.reviewFlags || [])
      setMessage(`Brouillon généré par ${json.model || 'l’agent'} — relecture obligatoire avant publication`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Génération impossible')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`px-3 py-1.5 text-xs rounded-lg border ${
              tab === item
                ? 'bg-white border-[var(--accent)] text-black'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {typeLabel(document.type)} · {status} · v{version.version_number}
        {version.ai_generated ? ' · généré IA' : ''}
      </p>

      {tab === 'Agent' ? (
        <div className="max-w-2xl space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">Consigne pour l’agent</p>
          <p className="text-sm text-slate-500">
            L’agent réécrit ce brouillon. Relisez ensuite l’onglet Contenu. Rien n’est mis en ligne automatiquement.
          </p>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="Décrivez la page à rédiger : sujet, preuves same’z, angle, appel à l’action…"
            className="w-full min-h-32 px-3 py-2.5 border border-black/[0.08] text-sm rounded-lg"
          />
          <textarea
            value={proofs}
            onChange={e => setProofs(e.target.value)}
            placeholder="Preuves same’z uniquement (clients, livrables, faits vérifiables)"
            className="w-full min-h-20 px-3 py-2.5 border border-black/[0.08] text-sm rounded-lg"
          />
          <input
            value={angle}
            onChange={e => setAngle(e.target.value)}
            placeholder="Angle éditorial (optionnel)"
            className="w-full px-3 py-2.5 border border-black/[0.08] text-sm rounded-lg"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || brief.trim().length < 20}
            className="btn btn-primary !py-2.5 !px-4 disabled:opacity-50"
          >
            {generating ? 'L’agent rédige…' : 'Demander à l’agent de rédiger'}
          </button>
          {reviewFlags.length > 0 ? (
            <ul className="text-sm text-amber-700 list-disc pl-5">
              {reviewFlags.map(flag => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {tab === 'Contenu' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Field label="Titre interne" value={form.title} onChange={value => update('title', value)} />
            <Field label="H1" value={form.h1 || ''} onChange={value => update('h1', value)} />
            <label className="block">
              <span className="text-xs font-medium text-gray-500 mb-1.5 block">Ajouter un bloc</span>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
                defaultValue=""
                onChange={e => {
                  const type = e.target.value as ContentBlock['type']
                  if (!type) return
                  update('blocks', [...form.blocks, createBlock(type)])
                  e.target.value = ''
                }}
              >
                <option value="">Choisir…</option>
                {BLOCK_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            {form.blocks.map((block, index) => (
              <div key={block.id} className="p-4 bg-[#fafafa] rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-400 uppercase">{block.type}</p>
                  <div className="flex gap-1">
                    <button type="button" className="text-xs text-gray-400" onClick={() => {
                      if (index === 0) return
                      const next = [...form.blocks]
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      update('blocks', next)
                    }}>↑</button>
                    <button type="button" className="text-xs text-gray-400" onClick={() => {
                      if (index === form.blocks.length - 1) return
                      const next = [...form.blocks]
                      ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                      update('blocks', next)
                    }}>↓</button>
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => update('blocks', form.blocks.filter((_, i) => i !== index))}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <BlockFields block={block} onChange={next => updateBlock(index, next)} />
              </div>
            ))}
          </div>
          <div>
            <div className="flex gap-2 mb-3">
              <button type="button" className="text-xs" onClick={() => setPreviewMode('desktop')}>
                Desktop
              </button>
              <button type="button" className="text-xs" onClick={() => setPreviewMode('mobile')}>
                Mobile
              </button>
            </div>
            <div
              className={`rounded-xl border border-gray-200 bg-[var(--navy)] text-white p-6 overflow-auto max-h-[70vh] ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Aperçu</p>
              <h2 className="font-display text-2xl mb-3">{form.h1 || form.title}</h2>
              <p className="text-sm text-slate-300 mb-4">{form.excerpt || form.metaDescription}</p>
              {form.blocks
                .filter(block => block.type === 'answer')
                .map(block =>
                  block.type === 'answer' ? (
                    <p key={block.id} className="text-sm border-l-2 border-emerald-400 pl-3 mb-3">
                      {block.text}
                    </p>
                  ) : null
                )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'SEO' ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Slug" value={form.slug} onChange={value => update('slug', value)} />
          <Field label="Silo" value={form.silo || ''} onChange={value => update('silo', value)} />
          <Field label="Meta title" value={form.metaTitle} onChange={value => update('metaTitle', value)} />
          <Field
            label="Mot-clé principal"
            value={form.keywordPrimary || ''}
            onChange={value => update('keywordPrimary', value)}
          />
          <label className="md:col-span-2 block">
            <span className="text-xs font-medium text-gray-500 mb-1.5 block">Meta description</span>
            <textarea
              value={form.metaDescription}
              onChange={e => update('metaDescription', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg min-h-24"
            />
          </label>
          <Field
            label="Canonical"
            value={form.canonicalPath || ''}
            onChange={value => update('canonicalPath', value)}
          />
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1.5 block">Intention</span>
            <select
              value={form.searchIntent || ''}
              onChange={e => update('searchIntent', (e.target.value || null) as SearchIntent | null)}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
            >
              <option value="">—</option>
              {SEARCH_INTENTS.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <Field label="Audience" value={form.audience || ''} onChange={value => update('audience', value)} />
          <Field label="CTA label" value={form.ctaLabel || ''} onChange={value => update('ctaLabel', value)} />
          <Field label="CTA lien" value={form.ctaHref || ''} onChange={value => update('ctaHref', value)} />
          <Field label="Image OG" value={form.ogImageUrl || ''} onChange={value => update('ogImageUrl', value)} />
          <Field label="OG title" value={form.ogTitle || ''} onChange={value => update('ogTitle', value)} />
          <Field
            label="OG description"
            value={form.ogDescription || ''}
            onChange={value => update('ogDescription', value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.robotsIndex}
              onChange={e => update('robotsIndex', e.target.checked)}
            />
            Index
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.robotsFollow}
              onChange={e => update('robotsFollow', e.target.checked)}
            />
            Follow
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isIndexable}
              onChange={e => update('isIndexable', e.target.checked)}
            />
            Inclure au sitemap
          </label>
        </div>
      ) : null}

      {tab === 'GEO' ? (
        <div className="space-y-4 max-w-2xl">
          <Field
            label="Résumé factuel"
            value={form.factualSummary || ''}
            onChange={value => update('factualSummary', value)}
          />
          <Field
            label="Entités (séparées par des virgules)"
            value={form.entities.map(item => item.name).join(', ')}
            onChange={value =>
              update(
                'entities',
                value
                  .split(',')
                  .map(name => name.trim())
                  .filter(Boolean)
                  .map(name => ({ name }))
              )
            }
          />
          <Field
            label="Localité (uniquement si preuve réelle)"
            value={form.geoLocality || ''}
            onChange={value => update('geoLocality', value)}
          />
          <Field label="Région" value={form.geoRegion || 'FR'} onChange={value => update('geoRegion', value)} />
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1.5 block">FAQ (question / réponse, séparées par ---)</span>
            <textarea
              value={form.faq.map(item => `${item.question}\n${item.answer}`).join('\n---\n')}
              onChange={e =>
                update(
                  'faq',
                  e.target.value.split('\n---\n').map(chunk => {
                    const [question, ...rest] = chunk.split('\n')
                    return { question: question || 'Question', answer: rest.join(' ') || 'Réponse à préciser.' }
                  })
                )
              }
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg min-h-28"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1.5 block">Sources (libellé | URL)</span>
            <textarea
              value={form.sources.map(item => `${item.label}${item.url ? ` | ${item.url}` : ''}`).join('\n')}
              onChange={e =>
                update(
                  'sources',
                  e.target.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(line => {
                      const [label, url] = line.split('|').map(part => part.trim())
                      return { label: label || 'Source', url: url || '' }
                    })
                )
              }
              className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg min-h-24"
            />
          </label>
        </div>
      ) : null}

      {tab === 'Maillage' ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#fafafa] rounded-xl text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-2">Liens entrants</p>
            {incoming.length === 0 ? (
              <p>Page orpheline : aucun lien interne approuvé ne pointe ici.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {incoming.map(item => (
                  <li key={`${item.slug}-${item.anchor}`}>
                    {item.slug} — « {item.anchor} »
                  </li>
                ))}
              </ul>
            )}
          </div>
          {suggestions.length > 0 ? (
            <div className="p-4 bg-[#fafafa] rounded-xl">
              <p className="text-sm font-medium text-gray-800 mb-2">Suggestions (même silo)</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg"
                    onClick={() =>
                      setLinks([
                        ...links,
                        { targetDocumentId: item.id, anchorText: item.slug, approved: true },
                      ])
                    }
                  >
                    + {item.slug}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {links.map((link, index) => (
            <div key={index} className="grid md:grid-cols-3 gap-3 p-4 bg-[#fafafa] rounded-xl">
              <select
                value={link.targetDocumentId}
                onChange={e => {
                  const next = [...links]
                  next[index] = { ...link, targetDocumentId: e.target.value }
                  setLinks(next)
                }}
                className="px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
              >
                <option value="">Cible</option>
                {documents
                  .filter(item => item.id !== document.id)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.slug}
                    </option>
                  ))}
              </select>
              <input
                value={link.anchorText}
                onChange={e => {
                  const next = [...links]
                  next[index] = { ...link, anchorText: e.target.value }
                  setLinks(next)
                }}
                placeholder="Ancre"
                className="px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={link.approved}
                  onChange={e => {
                    const next = [...links]
                    next[index] = { ...link, approved: e.target.checked }
                    setLinks(next)
                  }}
                />
                Approuvé
              </label>
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-[var(--accent-dark)]"
            onClick={() => setLinks([...links, { targetDocumentId: '', anchorText: '', approved: false }])}
          >
            + Ajouter un lien interne
          </button>
        </div>
      ) : null}

      {tab === 'Données' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            JSON-LD additionnel optionnel. Il doit refléter le contenu visible. Le graphe Article/FAQ/Service est généré automatiquement.
          </p>
          <textarea
            value={jsonLdText}
            onChange={e => setJsonLdText(e.target.value)}
            className="w-full min-h-48 px-3 py-2.5 border border-gray-200 text-sm rounded-lg font-mono"
            placeholder='{"@type":"HowTo"}'
          />
        </div>
      ) : null}

      {tab === 'Publication' ? (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Pour (re)générer le texte, utilisez l’onglet Agent. Ici : relecture humaine, programmation et publication.
          </p>
          <ul className="space-y-2">
            {checklist.map(item => (
              <li key={item.id} className="text-sm flex gap-2">
                <span>{item.ok ? '✓' : item.blocking ? '✕' : '·'}</span>
                <span className={item.ok ? 'text-gray-700' : 'text-gray-500'}>
                  {item.label}
                  {item.blocking ? ' (bloquant)' : ''}
                </span>
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.humanReviewed}
              onChange={e => update('humanReviewed', e.target.checked)}
            />
            J’ai relu ce contenu. Aucune invention, sources vérifiées.
          </label>
          <textarea
            value={form.reviewNotes || ''}
            onChange={e => update('reviewNotes', e.target.value)}
            placeholder="Notes de relecture"
            className="w-full min-h-20 px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSeoStatus(versionId, 'in_review')}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg"
            >
              Demander une revue
            </button>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={e => setScheduleAt(e.target.value)}
              className="px-3 py-2 border border-gray-200 text-sm rounded-lg"
            />
            <button
              type="button"
              disabled={!publishReady}
              onClick={async () => {
                try {
                  await persist()
                  await scheduleSeoVersion(versionId, new Date(scheduleAt).toISOString())
                  setMessage('Publication programmée')
                  router.refresh()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Programmation impossible')
                }
              }}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg disabled:opacity-50"
            >
              Programmer
            </button>
            <button
              type="button"
              disabled={!publishReady}
              onClick={async () => {
                try {
                  await persist()
                  await publishSeoVersion(versionId)
                  setStatus('published')
                  setMessage('Publié')
                  router.refresh()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Publication impossible')
                }
              }}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg disabled:opacity-50"
            >
              Publier
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'Historique' ? (
        <ul className="space-y-2">
          {versions.map(item => (
            <li key={item.id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-lg text-sm">
              <span>
                v{item.version_number} · {item.status} · {new Date(item.updated_at).toLocaleString('fr-FR')}
              </span>
              {item.id !== versionId ? (
                <button
                  type="button"
                  className="text-[var(--accent-dark)]"
                  onClick={async () => {
                    const restored = await restoreSeoVersion(document.id, item.id)
                    router.push(`/admin/seo/${document.id}`)
                    router.refresh()
                    setVersionId(restored.versionId)
                  }}
                >
                  Restaurer en brouillon
                </button>
              ) : (
                <span className="text-gray-400">version courante</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <Link href={`/admin/seo/${document.id}/preview`} className="px-5 py-2.5 border border-gray-200 text-sm rounded-lg">
          Preview
        </Link>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg"
      />
    </label>
  )
}

function MediaFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: 'media' }>
  onChange: (block: ContentBlock) => void
}) {
  const [uploading, setUploading] = useState(false)
  return (
    <>
      <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.url} placeholder="URL" onChange={e => onChange({ ...block, url: e.target.value })} />
      <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.alt} placeholder="Alt obligatoire" onChange={e => onChange({ ...block, alt: e.target.value })} />
      <input
        type="file"
        accept="image/*"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploading(true)
          const supabase = createClient()
          const ext = file.name.split('.').pop()
          const path = `${crypto.randomUUID()}.${ext}`
          const { error } = await supabase.storage.from('seo-assets').upload(path, file)
          if (!error) {
            const { data } = supabase.storage.from('seo-assets').getPublicUrl(path)
            const alt = block.alt || file.name.replace(/\.[^.]+$/, '')
            onChange({ ...block, url: data.publicUrl, alt })
            await registerSeoMedia(path, data.publicUrl, alt)
          }
          setUploading(false)
        }}
      />
      {uploading ? <p className="text-xs text-gray-400">Upload…</p> : null}
    </>
  )
}

function BlockFields({
  block,
  onChange,
}: {
  block: ContentBlock
  onChange: (block: ContentBlock) => void
}) {
  if (block.type === 'hero') {
    return (
      <>
        <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.eyebrow || ''} placeholder="Surligne" onChange={e => onChange({ ...block, eyebrow: e.target.value })} />
        <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.heading} placeholder="H1" onChange={e => onChange({ ...block, heading: e.target.value })} />
        <textarea className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.subheading || ''} placeholder="Chapô" onChange={e => onChange({ ...block, subheading: e.target.value })} />
      </>
    )
  }
  if (block.type === 'answer' || block.type === 'markdown') {
    const value = block.type === 'answer' ? block.text : block.markdown
    return (
      <textarea
        className="w-full min-h-28 px-3 py-2 border border-gray-200 text-sm rounded-lg"
        value={value}
        onChange={e =>
          onChange(
            block.type === 'answer' ? { ...block, text: e.target.value } : { ...block, markdown: e.target.value }
          )
        }
      />
    )
  }
  if (block.type === 'list') {
    return (
      <textarea
        className="w-full min-h-24 px-3 py-2 border border-gray-200 text-sm rounded-lg"
        value={block.items.join('\n')}
        onChange={e => onChange({ ...block, items: e.target.value.split('\n').filter(Boolean) })}
      />
    )
  }
  if (block.type === 'cta') {
    return (
      <>
        <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.heading} onChange={e => onChange({ ...block, heading: e.target.value })} />
        <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.href} onChange={e => onChange({ ...block, href: e.target.value })} />
        <input className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg" value={block.label} onChange={e => onChange({ ...block, label: e.target.value })} />
      </>
    )
  }
  if (block.type === 'media') {
    return <MediaFields block={block} onChange={onChange} />
  }
  if (block.type === 'faq') {
    return (
      <textarea
        className="w-full min-h-28 px-3 py-2 border border-gray-200 text-sm rounded-lg"
        value={block.items.map(item => `${item.question}\n${item.answer}`).join('\n---\n')}
        onChange={e =>
          onChange({
            ...block,
            items: e.target.value.split('\n---\n').map(chunk => {
              const [question, ...rest] = chunk.split('\n')
              return { question: question || 'Question', answer: rest.join(' ') || 'Réponse' }
            }),
          })
        }
      />
    )
  }
  return (
    <textarea
      className="w-full min-h-24 px-3 py-2 border border-gray-200 text-sm rounded-lg font-mono"
      value={JSON.stringify(block, null, 2)}
      onChange={e => {
        try {
          onChange(JSON.parse(e.target.value))
        } catch {
          // keep typing
        }
      }}
    />
  )
}
