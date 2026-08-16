interface Ai {
  run(
    model: string,
    inputs: {
      messages: { role: string; content: string }[]
      max_tokens?: number
      temperature?: number
    }
  ): Promise<{ response?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }>
}

interface Env {
  AI: Ai
  SEO_AGENT_SECRET: string
  SeoWriter: DurableObjectNamespace
}
