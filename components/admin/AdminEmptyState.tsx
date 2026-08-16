import type { ReactNode } from 'react'

export default function AdminEmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold tracking-tight text-[var(--navy)]">{title}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
