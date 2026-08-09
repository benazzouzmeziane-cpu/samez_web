'use client'

import { useEffect, useState } from 'react'

type Props = {
  title: string
  url: string
}

export default function ProjectPreviewModal({ title, url }: Props) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const id = requestAnimationFrame(() => setVisible(true))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary !py-2.5 !px-4">
        Voir le projet
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-8 transition-opacity duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden rounded-xl transition-[opacity,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
            }`}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] shrink-0">
              <h3 className="font-display text-sm font-semibold text-gray-800 truncate max-w-md">
                {title}
              </h3>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 bg-[var(--gray-light)] rounded-md px-3 py-1.5 text-xs text-gray-500 max-w-sm">
                  <span className="truncate">{url}</span>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn !p-2 text-gray-400"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn !p-2 text-gray-400"
                  aria-label="Fermer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 relative bg-[var(--gray-light)]">
              <iframe
                src={url}
                title={title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
