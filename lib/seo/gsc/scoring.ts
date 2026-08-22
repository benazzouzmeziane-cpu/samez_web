import { keywordsOverlap } from '@/lib/seo/cannibalization'

export type GscQueryMetric = {
  query: string
  impressions: number
  clicks: number
  position: number
}

export function gscBoostForKeyword(keyword: string, queries: GscQueryMetric[]) {
  let boost = 0
  let matchedQuery: string | null = null
  let impressions = 0

  for (const row of queries) {
    if (!keywordsOverlap(keyword, row.query)) continue
    const candidateBoost = Math.min(15, Math.round(Math.log10(row.impressions + 1) * 5))
    if (candidateBoost > boost) {
      boost = candidateBoost
      matchedQuery = row.query
      impressions = row.impressions
    }
  }

  return { boost, matchedQuery, impressions }
}
