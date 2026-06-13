import { ModelAdapterManager } from '../model-adapter/manager'
import { ChatRequest, ChatMessage } from '../model-adapter/base'
import { IncomingMessage, ChatRecord } from '../message-monitor/base'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'

export interface ReplyContext {
  incomingMessage: IncomingMessage
  recentMessages: ChatRecord[]
  styleProfile?: string
  systemPrompt?: string
}

export interface GeneratedReply {
  id: string
  content: string
  confidence: number
  model: string
  latency: number
  tokensUsed: number
}

export class ReplyGenerator {
  private modelManager: ModelAdapterManager

  constructor(modelManager: ModelAdapterManager) {
    this.modelManager = modelManager
  }

  async generateReply(context: ReplyContext): Promise<GeneratedReply> {
    const startTime = Date.now()
    const replyId = uuidv4()

    try {
      const prompt = this.buildPrompt(context)
      const messages = this.buildMessages(context)

      const request: ChatRequest = {
        messages,
        model: '',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: prompt
      }

      const response = await this.modelManager.chat(request)

      const confidence = this.calculateConfidence(response.content)

      return {
        id: replyId,
        content: response.content,
        confidence,
        model: response.model,
        latency: Date.now() - startTime,
        tokensUsed: response.usage.totalTokens
      }
    } catch (error) {
      log.error('Reply generation failed:', error)
      throw error
    }
  }

  async *generateReplyStream(context: ReplyContext): AsyncGenerator<string> {
    const prompt = this.buildPrompt(context)
    const messages = this.buildMessages(context)

    const request: ChatRequest = {
      messages,
      model: '',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: prompt
    }

    for await (const chunk of this.modelManager.chatStream(request)) {
      if (chunk.content) {
        yield chunk.content
      }
    }
  }

  private buildPrompt(context: ReplyContext): string {
    const parts: string[] = []

    parts.push('你是一个聊天助手，需要代替用户回复消息。')
    parts.push('')

    if (context.styleProfile) {
      parts.push('## 用户的说话风格')
      parts.push(context.styleProfile)
      parts.push('')
    }

    parts.push('## 当前对话上下文')
    if (context.recentMessages.length > 0) {
      for (const msg of context.recentMessages.slice(-10)) {
        const role = msg.direction === 'incoming' ? '对方' : '用户'
        parts.push(`${role}: ${msg.content}`)
      }
    } else {
      parts.push('(无历史消息)')
    }
    parts.push('')

    parts.push('## 联系人信息')
    parts.push(`- 名称: ${context.incomingMessage.source.name || '未知'}`)
    parts.push(`- 平台: ${context.incomingMessage.source.type === 'group' ? '群聊' : '私聊'}`)
    parts.push('')

    parts.push('## 要求')
    parts.push('1. 严格按照用户的说话风格回复，包括用词、语气、表情使用习惯')
    parts.push('2. 回复内容要自然、得体，符合当前对话上下文')
    parts.push('3. 回复长度参考用户的习惯')
    parts.push('4. 如果遇到不确定应该如何回复的情况，返回 [NEED_HUMAN_REVIEW]')
    parts.push('')
    parts.push('请生成一条回复：')

    return parts.join('\n')
  }

  private buildMessages(context: ReplyContext): ChatMessage[] {
    const messages: ChatMessage[] = []

    for (const msg of context.recentMessages.slice(-10)) {
      messages.push({
        role: msg.direction === 'incoming' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      })
    }

    messages.push({
      role: 'user',
      content: context.incomingMessage.content,
      timestamp: context.incomingMessage.timestamp
    })

    return messages
  }

  private calculateConfidence(content: string): number {
    if (content.includes('[NEED_HUMAN_REVIEW]')) {
      return 0.3
    }

    if (content.length < 2) {
      return 0.5
    }

    if (content.length > 500) {
      return 0.7
    }

    return 0.9
  }
}
