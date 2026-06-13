import { describe, it, expect, beforeEach } from 'vitest'
import { StrategyEngine, ContactPolicy } from '../../electron/services/strategy/engine'
import { IncomingMessage, ConversationContext } from '../../electron/services/message-monitor/base'

describe('StrategyEngine', () => {
  let engine: StrategyEngine

  beforeEach(() => {
    engine = new StrategyEngine()
  })

  describe('shouldAutoReply', () => {
    it('should return false when auto reply is disabled', () => {
      const message: IncomingMessage = {
        id: '1',
        source: { id: 'user1', type: 'private' },
        sender: { id: 'sender1', name: 'Test' },
        content: '你好',
        messageType: 'text',
        timestamp: Date.now()
      }

      const context: ConversationContext = {
        conversationId: 'conv1',
        recentMessages: [],
        contact: { id: 'user1', name: 'Test', platform: 'wechat' },
        userPolicy: {
          platform: 'wechat',
          contactId: 'user1',
          autoReply: false,
          replyMode: 'auto',
          delayMinMs: 1000,
          delayMaxMs: 5000,
          priority: 'normal'
        }
      }

      const decision = engine.shouldAutoReply(message, context)
      expect(decision.autoReply).toBe(false)
    })

    it('should return false when reply mode is off', () => {
      const message: IncomingMessage = {
        id: '1',
        source: { id: 'user1', type: 'private' },
        sender: { id: 'sender1', name: 'Test' },
        content: '你好',
        messageType: 'text',
        timestamp: Date.now()
      }

      const context: ConversationContext = {
        conversationId: 'conv1',
        recentMessages: [],
        contact: { id: 'user1', name: 'Test', platform: 'wechat' },
        userPolicy: {
          platform: 'wechat',
          contactId: 'user1',
          autoReply: true,
          replyMode: 'off',
          delayMinMs: 1000,
          delayMaxMs: 5000,
          priority: 'normal'
        }
      }

      const decision = engine.shouldAutoReply(message, context)
      expect(decision.autoReply).toBe(false)
    })

    it('should trigger keyword rule for urgent messages', () => {
      const message: IncomingMessage = {
        id: '1',
        source: { id: 'user1', type: 'private' },
        sender: { id: 'sender1', name: 'Test' },
        content: '紧急！请马上回复',
        messageType: 'text',
        timestamp: Date.now()
      }

      const context: ConversationContext = {
        conversationId: 'conv1',
        recentMessages: [],
        contact: { id: 'user1', name: 'Test', platform: 'wechat' },
        userPolicy: {
          platform: 'wechat',
          contactId: 'user1',
          autoReply: true,
          replyMode: 'auto',
          delayMinMs: 1000,
          delayMaxMs: 5000,
          priority: 'normal'
        }
      }

      const decision = engine.shouldAutoReply(message, context)
      expect(decision.autoReply).toBe(false)
      expect(decision.reason).toContain('关键词')
    })

    it('should allow auto reply for normal messages', () => {
      const message: IncomingMessage = {
        id: '1',
        source: { id: 'user1', type: 'private' },
        sender: { id: 'sender1', name: 'Test' },
        content: '你好，最近怎么样？',
        messageType: 'text',
        timestamp: Date.now()
      }

      const context: ConversationContext = {
        conversationId: 'conv1',
        recentMessages: [],
        contact: { id: 'user1', name: 'Test', platform: 'wechat' },
        userPolicy: {
          platform: 'wechat',
          contactId: 'user1',
          autoReply: true,
          replyMode: 'auto',
          delayMinMs: 1000,
          delayMaxMs: 5000,
          priority: 'normal'
        }
      }

      const decision = engine.shouldAutoReply(message, context)
      expect(decision.autoReply).toBe(true)
    })
  })

  describe('getReplyDelay', () => {
    it('should return delay within configured range', () => {
      const message: IncomingMessage = {
        id: '1',
        source: { id: 'user1', type: 'private' },
        sender: { id: 'sender1', name: 'Test' },
        content: '你好',
        messageType: 'text',
        timestamp: Date.now()
      }

      const context: ConversationContext = {
        conversationId: 'conv1',
        recentMessages: [],
        contact: { id: 'user1', name: 'Test', platform: 'wechat' },
        userPolicy: {
          platform: 'wechat',
          contactId: 'user1',
          autoReply: true,
          replyMode: 'auto',
          delayMinMs: 1000,
          delayMaxMs: 5000,
          priority: 'normal'
        }
      }

      const delay = engine.getReplyDelay(message, context)
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(10000)
    })
  })
})
