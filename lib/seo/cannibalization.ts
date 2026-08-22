export type KeywordTarget = {
  id: string
  slug: string
  path: string
  title: string
  keywordPrimary: string | null
}

export function normalizeKeyword(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantWords(value: string): string[] {
  return normalizeKeyword(value)
    .split(' ')
    .filter(word => word.length > 3)
}

export function keywordsOverlap(a: string, b: string): boolean {
  const left = normalizeKeyword(a)
  const right = normalizeKeyword(b)
  if (!left || !right) return false
  if (left === right) return true
  if (left.length >= 5 && right.length >= 5 && (left.includes(right) || right.includes(left))) {
    return true
  }

  const wordsA = new Set(significantWords(left))
  const wordsB = significantWords(right)
  if (wordsA.size === 0 || wordsB.length === 0) return false
  const overlap = wordsB.filter(word => wordsA.has(word)).length
  const threshold = Math.max(2, Math.ceil(Math.min(wordsA.size, wordsB.length) * 0.6))
  return overlap >= threshold
}

export function findCannibalizationConflicts(
  keyword: string | null | undefined,
  documentId: string,
  pages: KeywordTarget[]
): KeywordTarget[] {
  const needle = keyword?.trim()
  if (!needle) return []

  return pages.filter(page => {
    if (page.id === documentId) return false
    const candidates = [page.keywordPrimary, page.title].filter(Boolean) as string[]
    return candidates.some(candidate => keywordsOverlap(needle, candidate))
  })
}

export function cannibalizationMessage(conflicts: KeywordTarget[]): string | null {
  if (conflicts.length === 0) return null
  const first = conflicts[0]
  return `Cannibalisation SEO : « ${first.title} » (${first.path}) cible déjà une requête proche.`
}
