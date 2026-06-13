export interface ModelInfo {
  id: string
  name: string
  maxTokens?: number
  supportsStreaming?: boolean
}

export interface ModelConfig {
  provider: string
  apiKey: string
  endpoint?: string
  defaultModel: string
  timeout?: number
  maxRetries?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface ChatRequest {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  extra?: Record<string, unknown>
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ChatResponse {
  content: string
  usage: TokenUsage
  model: string
  latency: number
}

export interface ChatChunk {
  content: string
  done: boolean
}

export interface ModelAdapter {
  id: string
  name: string
  supportedModels: ModelInfo[]

  initialize(config: ModelConfig): Promise<void>
  chat(request: ChatRequest): Promise<ChatResponse>
  chatStream(request: ChatRequest): AsyncIterable<ChatChunk>
  testConnection(): Promise<boolean>
}

export abstract class BaseModelAdapter implements ModelAdapter {
  id: string
  name: string
  supportedModels: ModelInfo[]
  protected config: ModelConfig | null = null

  constructor(id: string, name: string, supportedModels: ModelInfo[]) {
    this.id = id
    this.name = name
    this.supportedModels = supportedModels
  }

  async initialize(config: ModelConfig): Promise<void> {
    this.config = config
  }

  abstract chat(request: ChatRequest): Promise<ChatResponse>
  abstract chatStream(request: ChatRequest): AsyncIterable<ChatChunk>
  abstract testConnection(): Promise<boolean>

  protected getConfig(): ModelConfig {
    if (!this.config) {
      throw new Error(`Model adapter ${this.id} not initialized`)
    }
    return this.config
  }

  protected buildHeaders(): Record<string, string> {
    const config = this.getConfig()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  }

  protected async makeRequest(url: string, body: unknown): Promise<unknown> {
    const config = this.getConfig()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API request failed: ${response.status} - ${error}`)
      }

      return await response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
}
