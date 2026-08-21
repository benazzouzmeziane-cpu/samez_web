interface Ai {
  run(
    model: string,
    inputs: {
      messages: { role: string; content: string }[]
      max_tokens?: number
      temperature?: number
      guided_json?: Record<string, unknown>
    }
  ): Promise<{ response?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }>
}

interface BrowserRun {
  quickAction(action: string, options: Record<string, unknown>): Promise<Response>
}

interface Env {
  AI: Ai
  BROWSER: BrowserRun
  BRAVE_SEARCH_API_KEY: string
  SEO_AGENT_SECRET: string
  SeoWriter: DurableObjectNamespace
  SeoStrategist: DurableObjectNamespace
}
