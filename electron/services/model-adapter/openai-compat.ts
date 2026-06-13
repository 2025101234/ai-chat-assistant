import {
  BaseModelAdapter,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ModelInfo
} from './base'

export class OpenAICompatAdapter extends BaseModelAdapter {
  constructor() {
    const models: ModelInfo[] = []
    super('openai-compat', 'OpenAI兼容', models)
  }

  async initialize(config: any): Promise<void> {
    await super.initialize(config)
    
    if (config.models && Array.isArray(config.models)) {
      this.supportedModels = config.models
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.getConfig()
    const startTime = Date.now()

    const messages = this.buildMessages(request)

    const body = {
      model: request.model || config.defaultModel,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000
    }

    const data = await this.makeRequest(
      `${config.endpoint}/chat/completions`,
      body
    ) as any

    const latency = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: data.model,
      latency
    }
  }

  async *chatStream(request: ChatRequest): AsyncIterable<ChatChunk> {
    const config = this.getConfig()
    const messages = this.buildMessages(request)

    const body = {
      model: request.model || config.defaultModel,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
      stream: true
    }

    const response = await fetch(
      `${config.endpoint}/chat/completions`,
      {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            yield { content: '', done: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            yield { content, done: false }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: this.getConfig().defaultModel,
        maxTokens: 10
      })
      return true
    } catch {
      return false
    }
  }

  private buildMessages(request: ChatRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = []

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt })
    }

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content })
    }

    return messages
  }
}
