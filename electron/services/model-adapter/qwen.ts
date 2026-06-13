import {
  BaseModelAdapter,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ModelInfo
} from './base'

export class QwenAdapter extends BaseModelAdapter {
  constructor() {
    const models: ModelInfo[] = [
      { id: 'qwen-turbo', name: '通义千问-Turbo', maxTokens: 8192, supportsStreaming: true },
      { id: 'qwen-plus', name: '通义千问-Plus', maxTokens: 32768, supportsStreaming: true },
      { id: 'qwen-max', name: '通义千问-Max', maxTokens: 32768, supportsStreaming: true },
      { id: 'qwen-max-longcontext', name: '通义千问-Max-长文本', maxTokens: 1000000, supportsStreaming: true }
    ]
    super('qwen', '通义千问', models)
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.getConfig()
    const startTime = Date.now()

    const messages = this.buildMessages(request)

    const body = {
      model: request.model || config.defaultModel,
      input: {
        messages
      },
      parameters: {
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        ...(request.systemPrompt && { system: request.systemPrompt })
      }
    }

    const data = await this.makeRequest(
      `${config.endpoint || 'https://dashscope.aliyuncs.com/api/v1'}/services/aigc/text-generation/generation`,
      body
    ) as any

    const latency = Date.now() - startTime

    return {
      content: data.output.choices[0].message.content,
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
      input: {
        messages
      },
      parameters: {
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        incremental_output: true,
        ...(request.systemPrompt && { system: request.systemPrompt })
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-DashScope-SSE': 'enable'
    }

    const response = await fetch(
      `${config.endpoint || 'https://dashscope.aliyuncs.com/api/v1'}/services/aigc/text-generation/generation`,
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
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()

          try {
            const parsed = JSON.parse(data)
            const content = parsed.output?.choices?.[0]?.message?.content || ''
            
            if (parsed.output?.finish_reason === 'stop') {
              yield { content: '', done: true }
              return
            }

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
        messages: [{ role: 'user', content: '你好' }],
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
