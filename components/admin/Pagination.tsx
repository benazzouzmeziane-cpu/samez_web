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
  pages.push(1)
  if (currentPage > 3) pages.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }
  if (currentPage < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  const href = (page: number) => {
    const sep = basePath.includes('?') ? '&' : '?'
    return `${basePath}${sep}page=${page}`
  }

  const pill = 'client-press px-3 py-1.5 text-xs font-medium rounded-lg border'

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className={`${pill} text-slate-500 border-black/10`}>
          Précédent
        </Link>
      ) : (
        <span className={`${pill} text-slate-300 border-black/[0.06] cursor-not-allowed`}>Précédent</span>
      )}

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-1.5 text-xs text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`${pill} ${
              p === currentPage
                ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
                : 'text-slate-500 border-black/10'
            }`}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className={`${pill} text-slate-500 border-black/10`}>
          Suivant
        </Link>
      ) : (
        <span className={`${pill} text-slate-300 border-black/[0.06] cursor-not-allowed`}>Suivant</span>
      )}
    </div>
  )
}
