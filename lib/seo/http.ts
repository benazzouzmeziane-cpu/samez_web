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
