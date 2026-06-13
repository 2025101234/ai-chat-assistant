import { ModelAdapter, ModelConfig, ChatRequest, ChatResponse, ChatChunk } from './base'
import { OpenAIAdapter } from './openai'
import { ClaudeAdapter } from './claude'
import { QwenAdapter } from './qwen'
import { MiMoAdapter } from './mimo'
import { DeepSeekAdapter } from './deepseek'
import { KimiAdapter } from './kimi'
import { OpenAICompatAdapter } from './openai-compat'
import log from 'electron-log'

export class ModelAdapterManager {
  private adapters: Map<string, ModelAdapter> = new Map()
  private activeAdapter: ModelAdapter | null = null

  constructor() {
    this.registerBuiltinAdapters()
  }

  private registerBuiltinAdapters(): void {
    const adapters = [
      new OpenAIAdapter(),
      new ClaudeAdapter(),
      new QwenAdapter(),
      new MiMoAdapter(),
      new DeepSeekAdapter(),
      new KimiAdapter(),
      new OpenAICompatAdapter()
    ]

    for (const adapter of adapters) {
      this.adapters.set(adapter.id, adapter)
      log.info(`Registered model adapter: ${adapter.id}`)
    }
  }

  getAdapter(id: string): ModelAdapter | undefined {
    return this.adapters.get(id)
  }

  getAllAdapters(): ModelAdapter[] {
    return Array.from(this.adapters.values())
  }

  async setActiveAdapter(id: string, config: ModelConfig): Promise<void> {
    const adapter = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Adapter not found: ${id}`)
    }

    await adapter.initialize(config)
    this.activeAdapter = adapter
    log.info(`Active model adapter set to: ${id}`)
  }

  getActiveAdapter(): ModelAdapter | null {
    return this.activeAdapter
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.activeAdapter) {
      throw new Error('No active model adapter')
    }

    return this.activeAdapter.chat(request)
  }

  async *chatStream(request: ChatRequest): AsyncIterable<ChatChunk> {
    if (!this.activeAdapter) {
      throw new Error('No active model adapter')
    }

    yield* this.activeAdapter.chatStream(request)
  }

  async testConnection(id: string, config: ModelConfig): Promise<boolean> {
    const adapter = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Adapter not found: ${id}`)
    }

    await adapter.initialize(config)
    return adapter.testConnection()
  }

  async chatWithFallback(request: ChatRequest, fallbackIds: string[]): Promise<ChatResponse> {
    const errors: Error[] = []

    if (this.activeAdapter) {
      try {
        return await this.activeAdapter.chat(request)
      } catch (error) {
        errors.push(error as Error)
        log.warn(`Primary adapter failed: ${error}`)
      }
    }

    for (const id of fallbackIds) {
      const adapter = this.adapters.get(id)
      if (!adapter) continue

      try {
        return await adapter.chat(request)
      } catch (error) {
        errors.push(error as Error)
        log.warn(`Fallback adapter ${id} failed: ${error}`)
      }
    }

    throw new Error(`All adapters failed: ${errors.map(e => e.message).join(', ')}`)
  }
}
