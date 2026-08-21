import Link from 'next/link'
import { renderMarkdown } from '@/lib/seo/markdown'
import { breadcrumbItems, collectFaq, collectSources } from '@/lib/seo/json-ld'
import type { SeoDocumentWithVersion } from '@/lib/seo/types'
import type { ContentBlock } from '@/lib/seo/schema'

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}

function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <header className="mb-10">
          {block.eyebrow ? <p className="section-label mb-4">{block.eyebrow}</p> : null}
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
            {block.heading}
          </h1>
          {block.subheading ? (
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">{block.subheading}</p>
          ) : null}
        </header>
      )
    case 'answer':
      return (
        <p className="text-lg text-slate-200 leading-relaxed mb-10 border-l-2 border-[var(--accent)] pl-5">
          {block.text}
        </p>
      )
    case 'markdown':
      return <div className="seo-prose mb-8">{renderMarkdown(block.markdown)}</div>
    case 'list':
      return (
        <section className="mb-8">
          {block.title ? (
            <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">{block.title}</h2>
          ) : null}
          {block.ordered ? (
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              {block.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              {block.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      )
    case 'steps':
      return (
        <section className="mb-10">
          {block.title ? (
            <h2 className="font-display text-2xl font-semibold tracking-tight mb-6">{block.title}</h2>
          ) : null}
          <ol className="space-y-6">
            {block.items.map((item, index) => (
              <li key={item.title} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="font-display text-sm font-semibold text-[var(--accent)] tabular-nums pt-1">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )
    case 'comparison':
      return (
        <section className="mb-10 overflow-x-auto">
          {block.title ? (
            <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">{block.title}</h2>
          ) : null}
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr>
                {block.columns.map(column => (
                  <th key={column} className="border-b border-white/10 py-3 pr-4 text-slate-200">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.cells.map((cell, j) => (
                    <td key={j} className="border-b border-white/5 py-3 pr-4 text-slate-400">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )
    case 'stats':
      return (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {block.items.map(item => (
            <div key={item.label}>
              <dt className="text-xs uppercase tracking-wide text-slate-500 mb-1">{item.label}</dt>
              <dd className="font-display text-2xl font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      )
    case 'quote':
      return (
        <blockquote className="mb-10 border-l-2 border-white/20 pl-5">
          <p className="text-lg text-slate-200 leading-relaxed">{block.text}</p>
          {block.author ? <footer className="text-sm text-slate-500 mt-3">{block.author}</footer> : null}
        </blockquote>
      )
    case 'media':
      return (
        <figure className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="w-full rounded-2xl border border-white/10" />
          {block.caption ? (
            <figcaption className="text-sm text-slate-500 mt-3">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    case 'faq':
      return (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-6">Questions fréquentes</h2>
          <dl className="space-y-6">
            {block.items.map(item => (
              <div key={item.question}>
                <dt className="font-medium text-slate-100 mb-2">{item.question}</dt>
                <dd className="text-slate-400 leading-relaxed">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )
    case 'sources':
      return (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-4">Sources</h2>
          <ul className="space-y-2 text-sm text-slate-400">
            {block.items.map(item => (
              <li key={item.label}>
                {item.url ? (
                  <a href={item.url} className="text-[var(--accent)] link-quiet" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </section>
      )
    case 'cta':
      return (
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="font-display text-2xl font-semibold mb-3">{block.heading}</h2>
          {block.text ? <p className="text-slate-400 mb-6">{block.text}</p> : null}
          <Link href={block.href} className="btn btn-primary">
            {block.label}
          </Link>
        </section>
      )
    case 'related':
      return (
        <nav className="mb-10" aria-label={block.title || 'À lire aussi'}>
          <h2 className="font-display text-xl font-semibold mb-4">{block.title || 'À lire aussi'}</h2>
          <ul className="space-y-2">
            {block.paths.map(path => (
              <li key={path}>
                <Link href={path} className="text-sm text-[var(--accent)] link-quiet">
                  {path}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )
  }
}

export default function SeoDocumentRenderer({
  doc,
  related,
}: {
  doc: SeoDocumentWithVersion
  related?: { path: string; title: string; anchor?: string }[]
}) {
  const crumbs = breadcrumbItems(doc)
  const faqs = collectFaq(doc)
  const sources = collectSources(doc)
  const published = formatDate(doc.version.published_at)
  const updated = formatDate(doc.version.updated_at)
  const hasHero = doc.version.blocks.some(block => block.type === 'hero')
  const hasFaqBlock = doc.version.blocks.some(block => block.type === 'faq')
  const hasSourcesBlock = doc.version.blocks.some(block => block.type === 'sources')

  return (
    <article className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
      <nav aria-label="Fil d’Ariane" className="text-xs text-slate-500 mb-8 flex flex-wrap gap-1">
        {crumbs.map((item, index) => (
          <span key={item.path} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            {index === crumbs.length - 1 ? (
              <span className="text-slate-400">{item.name}</span>
            ) : (
              <Link href={item.path} className="link-quiet">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {!hasHero ? (
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
          {doc.version.h1 || doc.version.title}
        </h1>
      ) : null}

      {doc.version.blocks.map(block => (
        <BlockView key={block.id} block={block} />
      ))}

      {!hasFaqBlock && faqs.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-6">Questions fréquentes</h2>
          <dl className="space-y-6">
            {faqs.map(item => (
              <div key={item.question}>
                <dt className="font-medium text-slate-100 mb-2">{item.question}</dt>
                <dd className="text-slate-400 leading-relaxed">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {!hasSourcesBlock && sources.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-4">Sources</h2>
          <ul className="space-y-2 text-sm text-slate-400">
            {sources.map(item => (
              <li key={item.label}>
                {item.url ? (
                  <a href={item.url} className="text-[var(--accent)] link-quiet" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related && related.length > 0 ? (
        <nav className="mb-10 pt-8 border-t border-white/10" aria-label="À lire aussi">
          <h2 className="font-display text-xl font-semibold mb-4">À lire aussi</h2>
          <ul className="space-y-2">
            {related.map(item => (
              <li key={item.path}>
                <Link href={item.path} className="text-sm text-[var(--accent)] link-quiet">
                  {item.anchor || item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <footer className="pt-8 border-t border-white/10 text-xs text-slate-500 space-y-1">
        <p>Auteur : {doc.version.author_name}</p>
        {published ? <p>Publié le {published}</p> : null}
        {updated ? <p>Mis à jour le {updated}</p> : null}
        {doc.version.entities.filter(entity => entity?.name).length > 0 ? (
          <p>Sujets : {doc.version.entities.filter(entity => entity?.name).map(entity => entity.name).join(', ')}</p>
        ) : null}
      </footer>
    </article>
  )
}
