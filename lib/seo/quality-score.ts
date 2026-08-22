import { buildChecklist, type ChecklistInput } from './checklist'
import type { ChecklistItem } from './types'

export const MIN_PUBLISH_SCORE = 70

export type QualityReport = {
  score: number
  items: ChecklistItem[]
  blockers: string[]
  warnings: string[]
}

export function computeQualityReport(input: ChecklistInput): QualityReport {
  const items = buildChecklist(input)
  const blocking = items.filter(item => item.blocking)
  const optional = items.filter(item => !item.blocking)

  const blockingScore = blocking.length
    ? (blocking.filter(item => item.ok).length / blocking.length) * 70
    : 70
  const optionalScore = optional.length
    ? (optional.filter(item => item.ok).length / optional.length) * 30
    : 30

  const blockers = blocking.filter(item => !item.ok).map(item => item.label)
  const warnings = optional.filter(item => !item.ok).map(item => item.label)

  return {
    score: Math.round(blockingScore + optionalScore),
    items,
    blockers,
    warnings,
  }
}

export function canPublishWithScore(report: QualityReport): boolean {
  return report.blockers.length === 0 && report.score >= MIN_PUBLISH_SCORE
}

export function publishGateMessage(report: QualityReport): string | null {
  if (report.blockers.length > 0) {
    return `Publication bloquée : ${report.blockers[0]}`
  }
  if (report.score < MIN_PUBLISH_SCORE) {
    return `Score qualité insuffisant (${report.score}/${MIN_PUBLISH_SCORE}). Complétez la FAQ, la réponse GEO ou le mot-clé.`
  }
  return null
}
