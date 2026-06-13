import { describe, it, expect, beforeEach } from 'vitest'
import { QualityChecker } from '../../electron/services/ai-reply/quality-check'

describe('QualityChecker', () => {
  let checker: QualityChecker

  beforeEach(() => {
    checker = new QualityChecker()
  })

  describe('check', () => {
    it('should pass for normal content', () => {
      const result = checker.check('你好，最近怎么样？')
      expect(result.passed).toBe(true)
      expect(result.score).toBeGreaterThan(50)
    })

    it('should fail for content with sensitive words', () => {
      checker.addSensitiveWord('测试敏感词')
      const result = checker.check('这是一个测试敏感词的内容')
      expect(result.passed).toBe(false)
      expect(result.issues.some(i => i.type === 'sensitive_word')).toBe(true)
    })

    it('should warn for too long content', () => {
      checker.setMaxLength(50)
      const result = checker.check('a'.repeat(100))
      expect(result.issues.some(i => i.type === 'too_long')).toBe(true)
    })

    it('should warn for too short content', () => {
      checker.setMinLength(10)
      const result = checker.check('hi')
      expect(result.issues.some(i => i.type === 'too_short')).toBe(true)
    })

    it('should detect unbalanced brackets', () => {
      const result = checker.check('这是一个（未闭合的括号')
      expect(result.issues.some(i => i.type === 'format_error')).toBe(true)
    })

    it('should detect excessive punctuation', () => {
      const result = checker.check('真的吗???!!!')
      expect(result.issues.some(i => i.type === 'format_error')).toBe(true)
    })
  })

  describe('sensitive words management', () => {
    it('should add and remove sensitive words', () => {
      checker.addSensitiveWord('test')
      expect(checker.check('this is a test').passed).toBe(false)
      
      checker.removeSensitiveWord('test')
      expect(checker.check('this is a test').passed).toBe(true)
    })
  })

  describe('length limits', () => {
    it('should update max length', () => {
      checker.setMaxLength(5)
      const result = checker.check('这是一段超过五个字的文本')
      expect(result.issues.some(i => i.type === 'too_long')).toBe(true)
    })

    it('should update min length', () => {
      checker.setMinLength(20)
      const result = checker.check('短文本')
      expect(result.issues.some(i => i.type === 'too_short')).toBe(true)
    })
  })
})
