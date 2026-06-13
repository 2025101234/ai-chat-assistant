import { describe, it, expect, beforeEach } from 'vitest'
import { CryptoService } from '../../electron/services/security/crypto'

describe('CryptoService', () => {
  let crypto: CryptoService

  beforeEach(() => {
    crypto = new CryptoService()
  })

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      await crypto.setMasterPassword('test-password')
      
      const plaintext = 'Hello, World!'
      const encrypted = crypto.encrypt(plaintext)
      
      expect(encrypted).not.toBe(plaintext)
      
      const decrypted = crypto.decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should throw error if master password not set', () => {
      expect(() => crypto.encrypt('test')).toThrow('Master password not set')
    })
  })

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', () => {
      const password = 'my-secret-password'
      const hash = crypto.hashPassword(password)
      
      expect(hash).toContain(':')
      
      const isValid = crypto.verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject invalid password', () => {
      const password = 'my-secret-password'
      const hash = crypto.hashPassword(password)
      
      const isValid = crypto.verifyPassword('wrong-password', hash)
      expect(isValid).toBe(false)
    })
  })

  describe('maskSensitiveInfo', () => {
    it('should mask phone numbers', () => {
      const text = '联系我：13812345678'
      const masked = crypto.maskSensitiveInfo(text)
      expect(masked).toBe('联系我：***手机号***')
    })

    it('should mask email addresses', () => {
      const text = '邮箱：test@example.com'
      const masked = crypto.maskSensitiveInfo(text)
      expect(masked).toBe('邮箱：***邮箱***')
    })

    it('should mask ID card numbers', () => {
      const text = '身份证：110101199001011234'
      const masked = crypto.maskSensitiveInfo(text)
      expect(masked).toBe('身份证：***身份证***')
    })

    it('should mask bank card numbers', () => {
      const text = '银行卡：6222021234567890123'
      const masked = crypto.maskSensitiveInfo(text)
      expect(masked).toBe('银行卡：***银行卡***')
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = crypto.generateId()
      const id2 = crypto.generateId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
    })
  })
})
