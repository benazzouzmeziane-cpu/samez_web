'use client'

export default function PiecePDFButton({
  pieceId,
  pieceNumber,
}: {
  pieceId: string
  pieceNumber: string
}) {
  const handleDownload = () => {
    window.open(`/api/pieces/pdf/${pieceId}`, '_blank')
  }

  return (
    <button
      onClick={handleDownload}
      className="px-5 py-2 border border-gray-200 text-sm text-gray-700 hover:border-black hover:text-black transition-colors flex items-center gap-2"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Télécharger PDF
    </button>
  )
}
