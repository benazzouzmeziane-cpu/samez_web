'use client'

import { useState } from 'react'

type Props = {
  accessToken: string | null
}

export default function CopyClientLinkButton({ accessToken }: Props) {
  const [copied, setCopied] = useState(false)

  if (!accessToken) return null

  const handleCopy = async () => {
    const url = `${window.location.origin}/espace-client/${accessToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {copied ? 'Lien copié !' : 'Lien espace client'}
    </button>
  )
}
