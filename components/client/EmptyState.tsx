import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
      <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
