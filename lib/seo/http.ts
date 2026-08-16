export async function readApiJson<T = { error?: string }>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text.trim()) {
    throw new Error(`Réponse vide (${response.status})`)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    if (/an error occurred/i.test(text) || response.status >= 500) {
      throw new Error(
        'La génération a été interrompue (délai serveur ou modèle NVIDIA indisponible). Réessayez.'
      )
    }
    throw new Error(text.replace(/\s+/g, ' ').trim().slice(0, 220))
  }
}

export type GenerationRunResponse<T> = {
  runId?: string
  status?: 'pending' | 'done' | 'error'
  document?: T
  reviewFlags?: string[]
  model?: string
  error?: string
  usage?: { prompt: number; completion: number }
}

export async function waitForSeoGeneration<T>(runId: string, timeoutMs = 70_000): Promise<GenerationRunResponse<T>> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await fetch(`/api/admin/seo/generate?runId=${encodeURIComponent(runId)}`)
    const json = await readApiJson<GenerationRunResponse<T>>(response)
    if (!response.ok && !json.status) {
      throw new Error(json.error || 'Suivi de génération impossible')
    }
    if (json.status === 'done' && json.document) return json
    if (json.status === 'error') {
      throw new Error(json.error || 'Génération impossible')
    }
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  throw new Error('La génération prend trop de temps. Réessayez dans un instant.')
}
