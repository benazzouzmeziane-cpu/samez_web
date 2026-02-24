'use client'

import Link from 'next/link'

type Props = {
  currentPage: number
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []

  // Always show first page
  pages.push(1)

  if (currentPage > 3) pages.push('...')

  // Pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) pages.push('...')

  // Always show last page
  if (totalPages > 1) pages.push(totalPages)

  const href = (page: number) => `${basePath}?page=${page}`

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* Précédent */}
      {currentPage > 1 ? (
        <Link
          href={href(currentPage - 1)}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-black border border-gray-200 rounded-lg hover:border-[var(--accent)] transition-colors"
        >
          ← Précédent
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg cursor-not-allowed">
          ← Précédent
        </span>
      )}

      {/* Numéros */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              p === currentPage
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'text-gray-500 border-gray-200 hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {p}
          </Link>
        )
      )}

      {/* Suivant */}
      {currentPage < totalPages ? (
        <Link
          href={href(currentPage + 1)}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-black border border-gray-200 rounded-lg hover:border-[var(--accent)] transition-colors"
        >
          Suivant →
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs text-gray-300 border border-gray-100 rounded-lg cursor-not-allowed">
          Suivant →
        </span>
      )}
    </div>
  )
}
