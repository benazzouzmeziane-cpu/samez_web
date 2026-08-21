import { contentBlockSchema, extraJsonLdSchema, faqItemSchema, generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
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

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function looksLikeInstruction(text: string, brief = '') {
  const value = normalize(text)
  if (!value) return true
  if (
    /^(rédiger|rédigez|écris|écrire|write a|la page doit|ajoute[rz]? une faq|ne pas inventer)/i.test(
      value
    )
  ) {
    return true
  }
  const consigne = normalize(brief)
  if (consigne.length >= 40 && value.includes(consigne.slice(0, 72))) return true
  return false
}

function blockText(block: unknown) {
  if (!block || typeof block !== 'object') return ''
  const item = block as Record<string, unknown>
  return [item.text, item.markdown, item.heading, item.subheading].filter(Boolean).join(' ')
}

export function fallbackFaq(brief: GenerationBrief) {
  const topic = brief.keywordPrimary
  return [
    {
      question: `Par où commencer pour ${topic} ?`,
      answer:
        'Par un diagnostic du process actuel : qui fait quoi, où ça casse, ce qui doit rester humain. same’z pose ensuite un premier périmètre utile, sans empiler des outils.',
    },
    {
      question: 'Faut-il du no-code (Make, Zapier) ou un développement sur mesure ?',
      answer:
        'Le no-code va vite sur des cas simples. Dès qu’il y a des règles métier, des volumes ou un besoin de tenue en production, un agent ou un développement ciblé tient mieux. Le choix se fait après le diagnostic, pas avant.',
    },
    {
      question: 'same’z invente-t-il des tarifs ou des résultats clients ?',
      answer:
        'Non. Seules les preuves fournies dans le brief sont mentionnées, et elles restent à relire avant publication. Les chiffres manquants vont dans les drapeaux de relecture.',
    },
    {
      question: 'Comment passer à l’action ?',
      answer:
        'Une session de 45 minutes suffit pour voir si le sujet mérite un build. Vous repartez avec un périmètre, pas avec une démo jetable.',
    },
  ]
}

export function fallbackEntities(brief: GenerationBrief) {
  const hay = `${brief.brief} ${brief.proofs || ''} ${brief.keywordPrimary} ${brief.title || ''} ${brief.angle || ''}`
  const known = [
    { name: "same'z", type: 'Organization' },
    { name: 'n8n', type: 'SoftwareApplication' },
    { name: 'Make', type: 'SoftwareApplication' },
    { name: 'Zapier', type: 'SoftwareApplication' },
    { name: 'Linqio', type: 'Organization' },
    { name: 'Macarte Imprimée', type: 'Organization' },
    { name: 'Univercarte', type: 'Organization' },
  ]
  const found = known.filter(item => hay.toLowerCase().includes(item.name.toLowerCase()))
  if (!found.some(item => item.name === "same'z")) found.unshift({ name: "same'z", type: 'Organization' })
  return found.slice(0, 8)
}

export function defaultHowToJsonLd(title: string, description: string) {
  return {
    '@type': 'HowTo',
    name: title,
    description,
    inLanguage: 'fr-FR',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Cartographier le process',
        text: 'Identifier les tâches répétables, les ruptures et ce qui doit rester humain.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Choisir le périmètre',
        text: 'Décider ce qui va dans un outil no-code, un agent ou un développement ciblé.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Construire et fiabiliser',
        text: 'Livrer un premier parcours tenable en production, avec suivi et points de contrôle.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Mesurer puis élargir',
        text: 'Ne scaler que ce qui tient. Les chiffres non fournis ne sont pas inventés.',
      },
    ],
  }
}

function isThinJsonLd(value: unknown) {
  if (!value || typeof value !== 'object') return true
  const extra = value as Record<string, unknown>
  if (!extra['@type']) return true
  if (extra['@type'] === 'HowTo' && !Array.isArray(extra.step)) return true
  return false
}

export function fallbackBlocks(brief: GenerationBrief) {
  const title = clip(brief.title || brief.keywordPrimary, 140)
  const topic = brief.keywordPrimary
  const proofs = clip(brief.proofs || 'Linqio, Macarte Imprimée, Univercarte — à relire avant publication.', 280)
  const angle = brief.angle ? ` ${clip(brief.angle, 180)}` : ''
  const answer = clip(
    `${title} s’adresse aux ${brief.audience}. same’z clarifie le process, pose un périmètre tenable, puis automatise ou développe ce qui crée vraiment de la valeur.${angle} Site, agents et automatisations : un système qui tient, pas une démo.`,
    600
  )
  const markdown = `## Pourquoi ${topic} compte pour une TPE

Les équipes perdent du temps sur des tâches répétables : relances, recopie, suivi, reporting. Empiler Make, Zapier ou n8n sans diagnostic crée de la dette. L’enjeu est un parcours fiable : demande, traitement, suivi, exception.

## No-code, agent ou sur-mesure

- No-code : rapide pour des cas simples, fragile dès que les règles métier s’empilent.
- Agent : utile quand il faut lire, classer, rédiger ou router avec un humain dans la boucle.
- Sur-mesure : quand le process est le produit, ou qu’il doit tenir des années.

## Ce que same’z construit

same’z est un développeur indépendant : sites, automatisations et agents. On commence par le process réel, on livre un premier périmètre utile, on n’invente ni tarif ni résultat client.

## Preuves à vérifier

${proofs}

## Comment on avance

Diagnostic, choix d’architecture, build, bascule. Une session de 45 minutes suffit pour savoir si le sujet mérite un build.`
  return [
    {
      id: 'h1',
      type: 'hero' as const,
      heading: title.length >= 4 ? title : clip(`${topic} | same’z`, 140),
      subheading: clip(`Pour ${brief.audience}`, 320),
    },
    {
      id: 'a1',
      type: 'answer' as const,
      text: answer.length >= 20 ? answer : clip(`${title}. Accompagnement same’z : site, agents et automatisations.`, 600),
    },
    {
      id: 'm1',
      type: 'markdown' as const,
      markdown,
    },
    {
      id: 's1',
      type: 'steps' as const,
      title: 'Déroulement type',
      items: [
        { title: 'Diagnostic', text: 'Cartographier le process actuel et les ruptures, sans jargon.' },
        { title: 'Périmètre', text: 'Décider no-code, agent ou développement. Un seul premier parcours utile.' },
        { title: 'Build', text: 'Livrer un système tenable en production, avec points de contrôle.' },
        { title: 'Suite', text: 'Élargir seulement ce qui tient. Relire les preuves avant de publier.' },
      ],
    },
    {
      id: 'f1',
      type: 'faq' as const,
      items: fallbackFaq(brief),
    },
    {
      id: 'c1',
      type: 'cta' as const,
      heading: 'Réserver 45 minutes',
      text: 'Voir si le sujet mérite un build, sans promesse inventée.',
      href: brief.ctaHref || '/reserver',
      label: brief.ctaLabel || 'Réserver 45 min',
    },
  ]
}

export function finalizeDocument(value: unknown, brief: GenerationBrief): GeneratedDocument {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const blocks: unknown[] = []
  let discardedInstruction = false
  for (const block of Array.isArray(raw.blocks) ? raw.blocks : []) {
    if (!block || typeof block !== 'object') continue
    const next = { ...(block as Record<string, unknown>), id: String((block as { id?: string }).id || newBlockId()) }
    if (!contentBlockSchema.safeParse(next).success) continue
    if (looksLikeInstruction(blockText(next), brief.brief)) {
      discardedInstruction = true
      continue
    }
    blocks.push(next)
  }

  const hasType = (type: string) =>
    blocks.some(block => block && typeof block === 'object' && (block as { type?: string }).type === type)

  for (const fallback of fallbackBlocks(brief)) {
    if (!hasType(fallback.type)) blocks.push(fallback)
  }

  const faqRaw = Array.isArray(raw.faq) ? raw.faq : []
  const faqValid = faqRaw.filter(item => faqItemSchema.safeParse(item).success)
  const faqItems = faqValid.length >= 2 ? faqValid : fallbackFaq(brief)
  if (!hasType('faq')) {
    blocks.push({ id: 'f1', type: 'faq', items: faqItems })
  }

  const title = clip(String(raw.title || brief.title || brief.keywordPrimary), 120)
  const safeTitle = title.length >= 4 && !looksLikeInstruction(title, brief.brief) ? title : clip(brief.title || `${brief.keywordPrimary}`, 120)
  const metaTitle = clip(String(raw.metaTitle || `${safeTitle} | same'z`), 70)
  const excerptSource = looksLikeInstruction(String(raw.excerpt || ''), brief.brief)
    ? ''
    : String(raw.excerpt || '')
  const summarySource = looksLikeInstruction(String(raw.factualSummary || ''), brief.brief)
    ? ''
    : String(raw.factualSummary || '')
  let metaDescription = looksLikeInstruction(String(raw.metaDescription || ''), brief.brief)
    ? ''
    : String(raw.metaDescription || excerptSource)
  if (metaDescription.length < 50) {
    metaDescription = clip(
      `${brief.keywordPrimary} pour ${brief.audience} : same’z construit sites, agents et automatisations qui tiennent en production.`.trim(),
      170
    )
  }
  const factualSummary = clip(
    summarySource ||
      `${safeTitle} : same’z aide ${brief.audience} à clarifier le process, choisir no-code / agent / sur-mesure, puis livrer un premier périmètre utile. Preuves à relire : ${clip(brief.proofs || 'aucune preuve chiffrée fournie.', 160)}`,
    600
  )
  const jsonLdCandidate = isThinJsonLd(raw.extraJsonLd)
    ? defaultHowToJsonLd(safeTitle, metaDescription)
    : raw.extraJsonLd
  const extraJsonLd = extraJsonLdSchema.safeParse(jsonLdCandidate).success
    ? jsonLdCandidate
    : defaultHowToJsonLd(safeTitle, metaDescription)
  const flags = Array.isArray(raw.reviewFlags) ? raw.reviewFlags.map(String) : []
  flags.push('Brouillon à relire avant publication.')
  if (discardedInstruction) {
    flags.push('La consigne a été écartée : elle ne doit pas apparaître comme contenu de page.')
  }

  return generatedDocumentSchema.parse({
    ...raw,
    title: safeTitle,
    h1: clip(
      looksLikeInstruction(String(raw.h1 || ''), brief.brief) ? safeTitle : String(raw.h1 || safeTitle),
      140
    ),
    excerpt: clip(excerptSource || factualSummary, 400),
    metaTitle: metaTitle.length >= 10 ? metaTitle : clip(`${safeTitle} | same'z`, 70),
    metaDescription,
    keywordPrimary: clip(String(raw.keywordPrimary || brief.keywordPrimary), 80),
    searchIntent: raw.searchIntent || brief.searchIntent,
    audience: raw.audience || brief.audience,
    entities: Array.isArray(raw.entities) && raw.entities.length > 0 ? raw.entities : fallbackEntities(brief),
    factualSummary,
    blocks,
    faq: faqItems,
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    suggestedLinks: Array.isArray(raw.suggestedLinks) && raw.suggestedLinks.length
      ? raw.suggestedLinks
      : [
          { path: '/reserver', anchorText: 'Réserver 45 min' },
          { path: '/services', anchorText: 'Voir les services' },
        ],
    extraJsonLd,
    ctaLabel: raw.ctaLabel || brief.ctaLabel || 'Réserver 45 min',
    ctaHref: raw.ctaHref || brief.ctaHref || '/reserver',
    reviewFlags: flags.slice(0, 20),
    silo: clip(String(raw.silo || brief.keywordPrimary), 60),
    geoLocality: typeof raw.geoLocality === 'string' && raw.geoLocality.trim() ? clip(raw.geoLocality, 80) : null,
    geoRegion: String(raw.geoRegion || 'FR').slice(0, 8),
    ogTitle: clip(String(raw.ogTitle || metaTitle), 70),
    ogDescription: clip(String(raw.ogDescription || metaDescription), 170),
  })
}

export function assignBlockIds(payload: GeneratedDocument): GeneratedDocument {
  return {
    ...payload,
    blocks: payload.blocks.map(block => ({ ...block, id: block.id || newBlockId() })),
  }
}
