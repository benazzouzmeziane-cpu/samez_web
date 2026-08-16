import type { VersionInput } from './schema'
import type { ChecklistItem } from './types'

export function buildChecklist(input: {
  title: string
  metaTitle: string
  metaDescription: string
  canonicalPath?: string | null
  blocks: VersionInput['blocks']
  faq: VersionInput['faq']
  sources: VersionInput['sources']
  humanReviewed: boolean
  keywordPrimary?: string | null
}): ChecklistItem[] {
  const hero = input.blocks.find(b => b.type === 'hero')
  const heading = hero && hero.type === 'hero' ? hero.heading : input.title
  const hasAnswer = input.blocks.some(block => block.type === 'answer')
  const hasBody = input.blocks.some(
    block => block.type === 'markdown' || block.type === 'steps' || block.type === 'list'
  )
  const mediaMissingAlt = input.blocks.some(
    block => block.type === 'media' && !block.alt.trim()
  )
  const keyword = input.keywordPrimary?.trim().toLowerCase() ?? ''
  const keywordUsed =
    !keyword ||
    heading.toLowerCase().includes(keyword) ||
    input.metaTitle.toLowerCase().includes(keyword)

  return [
    {
      id: 'title',
      label: 'Titre entre 10 et 70 caractères',
      ok: input.metaTitle.length >= 10 && input.metaTitle.length <= 70,
      blocking: true,
    },
    {
      id: 'description',
      label: 'Meta description entre 50 et 160 caractères',
      ok: input.metaDescription.length >= 50 && input.metaDescription.length <= 160,
      blocking: true,
    },
    {
      id: 'canonical',
      label: 'Chemin canonique renseigné',
      ok: Boolean(input.canonicalPath && input.canonicalPath.startsWith('/')),
      blocking: true,
    },
    {
      id: 'h1',
      label: 'Un H1 unique (bloc hero ou titre)',
      ok: heading.trim().length >= 4,
      blocking: true,
    },
    {
      id: 'body',
      label: 'Au moins un bloc de contenu (texte, étapes ou liste)',
      ok: hasBody,
      blocking: true,
    },
    {
      id: 'answer',
      label: 'Réponse directe en tête de page (GEO)',
      ok: hasAnswer,
      blocking: false,
    },
    {
      id: 'faq',
      label: 'FAQ structurée (2 questions ou plus)',
      ok: input.faq.length >= 2,
      blocking: false,
    },
    {
      id: 'sources',
      label: 'Sources ou preuves citées',
      ok: input.sources.length >= 1,
      blocking: true,
    },
    {
      id: 'alt',
      label: 'Texte alternatif sur chaque média',
      ok: !mediaMissingAlt,
      blocking: true,
    },
    {
      id: 'keyword',
      label: 'Mot-clé principal présent dans le H1 ou le title',
      ok: keywordUsed,
      blocking: false,
    },
    {
      id: 'jsonld',
      label: 'Données structurées générées (Article/Service/FAQ selon le type)',
      ok: true,
      blocking: false,
    },
    {
      id: 'review',
      label: 'Relecture humaine confirmée',
      ok: input.humanReviewed,
      blocking: true,
    },
  ]
}

export function canPublish(items: ChecklistItem[]): boolean {
  return items.filter(item => item.blocking).every(item => item.ok)
}
