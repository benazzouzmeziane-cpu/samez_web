interface Ai {
  run(
    model: string,
    inputs: {
      messages: { role: string; content: string }[]
      max_tokens?: number
      temperature?: number
      guided_json?: Record<string, unknown>
      response_format?: {
        type: 'json_object' | 'json_schema'
        json_schema?: Record<string, unknown>
      }
    }
  ): Promise<{ response?: unknown; usage?: { prompt_tokens?: number; completion_tokens?: number } }>
}

interface BrowserRun {
  quickAction(action: string, options: Record<string, unknown>): Promise<Response>
}

interface Env {
  AI: Ai
  BROWSER: BrowserRun
  BRAVE_SEARCH_API_KEY: string
  SEO_AGENT_SECRET: string
  NVIDIA_API_KEY?: string
  NVIDIA_NIM_MODEL?: string
  NVIDIA_NIM_BASE_URL?: string
  SeoWriter: DurableObjectNamespace
  SeoStrategist: DurableObjectNamespace
  SamezOrchestrator: DurableObjectNamespace
  SeoStrategistAgent: DurableObjectNamespace
  RadarAgent: DurableObjectNamespace
  CrmAgent: DurableObjectNamespace
  AnalystAgent: DurableObjectNamespace
  CriticAgent: DurableObjectNamespace
}
