import {
  BaseModelAdapter,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ModelInfo
} from './base'

export class ClaudeAdapter extends BaseModelAdapter {
  constructor() {
    const models: ModelInfo[] = [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 200000, supportsStreaming: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 200000, supportsStreaming: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 200000, supportsStreaming: true },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 200000, supportsStreaming: true }
    ]
    super('claude', 'Anthropic Claude', models)
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.getConfig()
    const startTime = Date.now()

    const messages = this.buildMessages(request)

    const body = {
      model: request.model || config.defaultModel,
      messages,
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.7,
      ...(request.systemPrompt && { system: request.systemPrompt })
    }

    const data = await this.makeRequest(
      `${config.endpoint || 'https://api.anthropic.com/v1'}/messages`,
      body
    ) as any

    const latency = Date.now() - startTime

    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
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
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.7,
      stream: true,
      ...(request.systemPrompt && { system: request.systemPrompt })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    }

    const response = await fetch(
      `${config.endpoint || 'https://api.anthropic.com/v1'}/messages`,
      {
        method: 'POST',
        headers,
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

          try {
            const parsed = JSON.parse(data)
            
            if (parsed.type === 'content_block_delta') {
              yield { content: parsed.delta.text, done: false }
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true }
              return
            }
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

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content })
    }

    return messages
  }
}
