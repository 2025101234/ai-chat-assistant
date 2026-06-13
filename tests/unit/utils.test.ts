import { describe, it, expect } from 'vitest'
import { formatTime, formatRelativeTime, formatFileSize, generateId, maskSensitiveInfo, truncateText } from '../../src/utils'

describe('Utils', () => {
  describe('formatTime', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2026-06-12T10:30:00').getTime()
      const formatted = formatTime(timestamp)
      expect(formatted).toBe('2026-06-12 10:30:00')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should return string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('maskSensitiveInfo', () => {
    it('should mask phone numbers', () => {
      const text = '我的手机号是13812345678'
      const masked = maskSensitiveInfo(text)
      expect(masked).toBe('我的手机号是***手机号***')
    })

    it('should mask email addresses', () => {
      const text = '联系我 test@example.com'
      const masked = maskSensitiveInfo(text)
      expect(masked).toBe('联系我 ***邮箱***')
    })

    it('should mask ID card numbers', () => {
      const text = '身份证号 110101199001011234'
      const masked = maskSensitiveInfo(text)
      expect(masked).toBe('身份证号 ***身份证***')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = '这是一段很长的文本，需要被截断'
      const truncated = truncateText(text, 10)
      expect(truncated).toBe('这是一段很长的文本，需...')
    })

    it('should not truncate short text', () => {
      const text = '短文本'
      const truncated = truncateText(text, 10)
      expect(truncated).toBe('短文本')
    })
  })
})
