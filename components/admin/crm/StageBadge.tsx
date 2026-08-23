import { STAGE_LABELS, STAGE_STYLES, asStage } from '@/lib/admin/crm'

export default function StageBadge({ stage }: { stage: string }) {
  const value = asStage(stage)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${STAGE_STYLES[value]}`}>
      {STAGE_LABELS[value]}
    </span>
  )
}
