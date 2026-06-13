import { IncomingMessage, ChatRecord, Contact, Group } from '../message-monitor/base'
import log from 'electron-log'

export interface Decision {
  autoReply: boolean
  reason?: string
  confidence: number
}

export interface ConversationContext {
  conversationId: string
  recentMessages: ChatRecord[]
  contact: Contact | Group
  userPolicy: ContactPolicy
}

export interface ContactPolicy {
  platform: string
  contactId: string
  autoReply: boolean
  replyMode: 'auto' | 'confirm' | 'off'
  modelOverride?: string
  delayMinMs: number
  delayMaxMs: number
  priority: 'high' | 'normal' | 'low'
}

export interface StrategyRule {
  id: string
  name: string
  condition: (message: IncomingMessage, context: ConversationContext) => boolean
  action: (message: IncomingMessage, context: ConversationContext) => Decision
  priority: number
}

export class StrategyEngine {
  private rules: StrategyRule[] = []
  private defaultPolicy: ContactPolicy = {
    platform: '',
    contactId: '',
    autoReply: true,
    replyMode: 'auto',
    delayMinMs: 1000,
    delayMaxMs: 5000,
    priority: 'normal'
  }

  constructor() {
    this.registerDefaultRules()
  }

  private registerDefaultRules(): void {
    this.addRule({
      id: 'disable-policy',
      name: '禁用策略检查',
      condition: (_, context) => !context.userPolicy.autoReply,
      action: () => ({
        autoReply: false,
        reason: '该联系人已禁用自动回复',
        confidence: 1
      }),
      priority: 100
    })

    this.addRule({
      id: 'off-mode',
      name: '关闭模式检查',
      condition: (_, context) => context.userPolicy.replyMode === 'off',
      action: () => ({
        autoReply: false,
        reason: '回复模式已关闭',
        confidence: 1
      }),
      priority: 99
    })

    this.addRule({
      id: 'confirm-mode',
      name: '确认模式检查',
      condition: (_, context) => context.userPolicy.replyMode === 'confirm',
      action: () => ({
        autoReply: false,
        reason: '需要人工确认',
        confidence: 0.8
      }),
      priority: 98
    })

    this.addRule({
      id: 'keyword-trigger',
      name: '关键词触发',
      condition: (message) => {
        const keywords = ['紧急', '急', '重要', '快', '马上']
        return keywords.some(k => message.content.includes(k))
      },
      action: () => ({
        autoReply: false,
        reason: '触发关键词，需要人工介入',
        confidence: 0.9
      }),
      priority: 90
    })

    this.addRule({
      id: 'default-allow',
      name: '默认允许',
      condition: () => true,
      action: () => ({
        autoReply: true,
        confidence: 0.8
      }),
      priority: 0
    })

    log.info('Default strategy rules registered')
  }

  addRule(rule: StrategyRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter(r => r.id !== id)
  }

  shouldAutoReply(message: IncomingMessage, context: ConversationContext): Decision {
    for (const rule of this.rules) {
      if (rule.condition(message, context)) {
        const decision = rule.action(message, context)
        log.debug(`Rule ${rule.id} applied: autoReply=${decision.autoReply}`)
        return decision
      }
    }

    return {
      autoReply: true,
      confidence: 0.5
    }
  }

  getReplyDelay(message: IncomingMessage, context: ConversationContext): number {
    const { delayMinMs, delayMaxMs } = context.userPolicy
    
    const baseDelay = Math.random() * (delayMaxMs - delayMinMs) + delayMinMs
    
    const lengthFactor = Math.min(message.content.length / 100, 2)
    const adjustedDelay = baseDelay * (1 + lengthFactor * 0.5)
    
    return Math.round(adjustedDelay)
  }

  getModelForMessage(message: IncomingMessage, context: ConversationContext): string | null {
    return context.userPolicy.modelOverride || null
  }

  setDefaultPolicy(policy: Partial<ContactPolicy>): void {
    this.defaultPolicy = { ...this.defaultPolicy, ...policy }
  }

  getDefaultPolicy(): ContactPolicy {
    return { ...this.defaultPolicy }
  }
}
