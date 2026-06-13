import {
  BaseModelAdapter,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ModelInfo
} from './base'

export class OpenAIAdapter extends BaseModelAdapter {
  constructor() {
    const models: ModelInfo[] = [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000, supportsStreaming: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000, supportsStreaming: true },
      { id: 'gpt-4.1', name: 'GPT-4.1', maxTokens: 128000, supportsStreaming: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', maxTokens: 128000, supportsStreaming: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16385, supportsStreaming: true }
    ]
    super('openai', 'OpenAI', models)
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
      `${config.endpoint || 'https://api.openai.com/v1'}/chat/completions`,
      body
    ) as any

    const latency = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
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
      `${config.endpoint || 'https://api.openai.com/v1'}/chat/completions`,
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
