import type { ReactNode } from 'react'

export default function AdminPageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-tight leading-[1.15] text-[var(--navy)]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
