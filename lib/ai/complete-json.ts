import { extractJson } from '@/lib/seo/ai-document'

const NVCF_STATUS = 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/status'

const FAST_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b',
  'microsoft/phi-4-mini-instruct',
]

function messageText(message?: { content?: unknown }): string {
  const content = message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text || '')
        }
        return ''
      })
      .join('')
  }
  return ''
}

export function isNimConfigured() {
  return Boolean(process.env.NVIDIA_API_KEY?.trim())
}

export async function completeJson(
  system: string,
  user: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<unknown> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim()
  if (!apiKey) throw new Error('NVIDIA_API_KEY manquante')
  const baseUrl = (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')
  const preferred = process.env.NVIDIA_NIM_MODEL?.trim()
  const models = [...new Set([preferred, ...FAST_MODELS].filter(Boolean))] as string[]

  let lastError = 'Aucune réponse IA'
  for (const model of models.slice(0, 2)) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'NVCF-POLL-SECONDS': '15',
        },
        body: JSON.stringify({
          model,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 700,
          stream: false,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          ...(/nemotron|lightning/i.test(model)
            ? { chat_template_kwargs: { enable_thinking: false }, reasoning_budget: 0 }
            : {}),
        }),
        signal: AbortSignal.timeout(18_000),
      })

      let current = response
      if (current.status === 202) {
        const requestId = current.headers.get('nvcf-reqid') || current.headers.get('NVCF-REQID')
        if (!requestId) throw new Error('NVIDIA 202 sans suivi')
        current = await fetch(`${NVCF_STATUS}/${requestId}`, {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(12_000),
        })
      }
      if (!current.ok) {
        lastError = `NVIDIA ${current.status}`
        continue
      }
      const json = (await current.json()) as {
        choices?: { message?: { content?: unknown } }[]
      }
      const content = messageText(json.choices?.[0]?.message)
      if (!content.trim()) {
        lastError = 'Réponse vide'
        continue
      }
      return extractJson(content)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'échec IA'
    }
  }
  throw new Error(lastError)
}
