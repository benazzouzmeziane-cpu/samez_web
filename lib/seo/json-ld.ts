import { SITE_ORIGIN, absoluteUrl, documentPath } from './paths'
import { markdownToPlainText } from './plain-text'
import type { SeoDocumentWithVersion } from './types'
import type { FaqItem } from './schema'

export function collectFaq(doc: SeoDocumentWithVersion): FaqItem[] {
  const fromBlocks = doc.version.blocks.flatMap(block =>
    block.type === 'faq' ? block.items : []
  )
  return [...doc.version.faq, ...fromBlocks]
}

export function collectSources(doc: SeoDocumentWithVersion) {
  const fromBlocks = doc.version.blocks.flatMap(block =>
    block.type === 'sources' ? block.items : []
  )
  return [...doc.version.sources, ...fromBlocks]
}

export function breadcrumbItems(doc: SeoDocumentWithVersion) {
  const items = [{ name: 'Accueil', path: '/' }]
  if (doc.type === 'service') items.push({ name: 'Services', path: '/services' })
  if (doc.type === 'guide') items.push({ name: 'Guides', path: '/guides' })
  if (doc.type === 'case_study') items.push({ name: 'Réalisations', path: '/realisations' })
  items.push({ name: doc.version.h1 || doc.version.title, path: doc.path })
  return items
}

function articleBody(doc: SeoDocumentWithVersion): string {
  return doc.version.blocks
    .map(block => {
      if (block.type === 'markdown') return markdownToPlainText(block.markdown)
      if (block.type === 'answer') return block.text
      if (block.type === 'hero') return block.heading
      return ''
    })
    .filter(Boolean)
    .join(' ')
    .slice(0, 5000)
}

export function buildJsonLd(doc: SeoDocumentWithVersion) {
  const url = absoluteUrl(doc.path)
  const faqs = collectFaq(doc)
  const crumbs = breadcrumbItems(doc)
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: doc.version.meta_title || doc.version.title,
      description: doc.version.meta_description || doc.version.excerpt,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${SITE_ORIGIN}/#organization` },
      dateModified: doc.version.updated_at,
      datePublished: doc.version.published_at || doc.version.created_at,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    },
  ]

  if (doc.type === 'guide' || doc.type === 'pillar' || doc.type === 'case_study') {
    graph.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: doc.version.h1 || doc.version.title,
      description: doc.version.meta_description || doc.version.excerpt,
      datePublished: doc.version.published_at || doc.version.created_at,
      dateModified: doc.version.updated_at,
      inLanguage: 'fr-FR',
      author: {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: doc.version.author_name,
      },
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      mainEntityOfPage: { '@id': `${url}#webpage` },
      articleBody: articleBody(doc),
      ...(doc.version.og_image_url
        ? { image: [absoluteUrl(doc.version.og_image_url)] }
        : {}),
    })
  }

  if (doc.type === 'service') {
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: doc.version.h1 || doc.version.title,
      description: doc.version.meta_description || doc.version.excerpt,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      areaServed: doc.version.geo_region || 'FR',
      url,
    })
  }

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faqs.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  if (doc.version.extra_json_ld && typeof doc.version.extra_json_ld === 'object') {
    const extra = { ...doc.version.extra_json_ld }
    delete extra['@context']
    graph.push(extra)
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export { documentPath }
