import { contentBlockSchema, generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

function repairJson(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim()
}

function closeTruncatedJson(text: string): string {
  let inString = false
  let escape = false
  const stack: string[] = []
  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if ((ch === '}' || ch === ']') && stack.length) stack.pop()
  }
  let closed = text
  if (inString) closed += '"'
  closed = closed.replace(/,\s*$/, '')
  closed = closed.replace(/,?\s*"[^"\\]*"\s*:\s*$/, '')
  closed = closed.replace(/,?\s*"[^"\\]*$/, '')
  closed = closed.replace(/,\s*$/, '')
  while (stack.length) closed += stack.pop()
  return closed
}

export function extractJson(text: string): unknown {
  const stripped = repairJson(text)
  const start = stripped.indexOf('{')
  if (start === -1) throw new Error('Réponse IA sans JSON')
  const raw = stripped.slice(start)
  const end = raw.lastIndexOf('}')
  const candidates = [
    end === -1 ? raw : raw.slice(0, end + 1),
    raw,
    closeTruncatedJson(raw),
    closeTruncatedJson(repairJson(raw)),
  ]
  let lastError = 'JSON IA invalide'
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }
  throw new Error(lastError)
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max)
}

export function fallbackBlocks(brief: GenerationBrief) {
  const title = clip(brief.title || brief.keywordPrimary, 140)
  const answer = clip(brief.brief, 600)
  return [
    {
      id: 'h1',
      type: 'hero' as const,
      heading: title.length >= 4 ? title : clip(`${brief.keywordPrimary} same'z`, 140),
      subheading: clip(brief.audience, 320),
    },
    {
      id: 'a1',
      type: 'answer' as const,
      text: answer.length >= 20 ? answer : clip(`${title}. ${brief.brief} ${brief.audience}`, 600),
    },
    {
      id: 'm1',
      type: 'markdown' as const,
      markdown: `## ${brief.keywordPrimary}\n\n${clip(brief.brief, 800)}\n\n### Preuves à vérifier\n\n${clip(brief.proofs || 'Aucune preuve fournie dans le brief.', 400)}`,
    },
    {
      id: 'c1',
      type: 'cta' as const,
      heading: 'Réserver 45 minutes',
      href: brief.ctaHref || '/reserver',
      label: brief.ctaLabel || 'Réserver 45 min',
    },
  ]
}

export function finalizeDocument(value: unknown, brief: GenerationBrief): GeneratedDocument {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const blocks: unknown[] = []
  for (const block of Array.isArray(raw.blocks) ? raw.blocks : []) {
    if (!block || typeof block !== 'object') continue
    const next = { ...(block as Record<string, unknown>), id: String((block as { id?: string }).id || newBlockId()) }
    if (contentBlockSchema.safeParse(next).success) blocks.push(next)
  }

  const hasType = (type: string) =>
    blocks.some(block => block && typeof block === 'object' && (block as { type?: string }).type === type)

  for (const fallback of fallbackBlocks(brief)) {
    if (!hasType(fallback.type)) blocks.push(fallback)
  }

  const title = clip(String(raw.title || brief.title || brief.keywordPrimary), 120)
  const metaTitle = clip(String(raw.metaTitle || title), 70)
  let metaDescription = String(raw.metaDescription || raw.excerpt || '')
  if (metaDescription.length < 50) {
    metaDescription = clip(
      `${metaDescription} ${brief.keywordPrimary} : accompagnement same'z pour TPE/PME, site et automatisations.`.trim(),
      170
    )
  }
  const flags = Array.isArray(raw.reviewFlags) ? raw.reviewFlags.map(String) : []
  flags.push('Brouillon à relire : structure ou textes peuvent avoir été complétés automatiquement.')

  return generatedDocumentSchema.parse({
    ...raw,
    title: title.length >= 4 ? title : clip(`${brief.keywordPrimary} | same'z`, 120),
    h1: clip(String(raw.h1 || title), 140),
    excerpt: raw.excerpt ? clip(String(raw.excerpt), 400) : clip(brief.brief, 400),
    metaTitle: metaTitle.length >= 10 ? metaTitle : clip(`${title} | same'z`, 70),
    metaDescription,
    keywordPrimary: clip(String(raw.keywordPrimary || brief.keywordPrimary), 80),
    searchIntent: raw.searchIntent || brief.searchIntent,
    audience: raw.audience || brief.audience,
    entities: Array.isArray(raw.entities) ? raw.entities : [{ name: "same'z", type: 'Organization' }],
    factualSummary: raw.factualSummary ? clip(String(raw.factualSummary), 600) : clip(brief.brief, 600),
    blocks,
    faq: Array.isArray(raw.faq) ? raw.faq : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    suggestedLinks: Array.isArray(raw.suggestedLinks)
      ? raw.suggestedLinks
      : [{ path: '/reserver', anchorText: 'Réserver 45 min' }],
    extraJsonLd: raw.extraJsonLd ?? null,
    ctaLabel: raw.ctaLabel || brief.ctaLabel || 'Réserver 45 min',
    ctaHref: raw.ctaHref || brief.ctaHref || '/reserver',
    reviewFlags: flags.slice(0, 20),
  })
}

export function assignBlockIds(payload: GeneratedDocument): GeneratedDocument {
  return {
    ...payload,
    blocks: payload.blocks.map(block => ({ ...block, id: block.id || newBlockId() })),
  }
}
