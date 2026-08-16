import Link from 'next/link'

export default function AdminChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`client-press inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
        active
          ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
          : 'border-black/[0.08] text-slate-600 bg-white admin-chip'
      }`}
    >
      {children}
    </Link>
  )
}
