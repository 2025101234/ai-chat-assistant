import crypto from 'crypto'
import log from 'electron-log'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 64
const ITERATIONS = 100000

export class CryptoService {
  private masterKey: Buffer | null = null

  async setMasterPassword(password: string): Promise<void> {
    const salt = crypto.randomBytes(SALT_LENGTH)
    this.masterKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')
    
    log.info('Master password set successfully')
  }

  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')
  }

  encrypt(plaintext: string): string {
    if (!this.masterKey) {
      throw new Error('Master password not set')
    }

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    const result = iv.toString('hex') + tag.toString('hex') + encrypted
    return result
  }

  decrypt(ciphertext: string): string {
    if (!this.masterKey) {
      throw new Error('Master password not set')
    }

    const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex')
    const encrypted = ciphertext.slice((IV_LENGTH + TAG_LENGTH) * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')
    
    return salt.toString('hex') + ':' + hash.toString('hex')
  }

  verifyPassword(password: string, storedHash: string): boolean {
    const [saltHex, hashHex] = storedHash.split(':')
    const salt = Buffer.from(saltHex, 'hex')
    const storedHashBuffer = Buffer.from(hashHex, 'hex')

    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512')

    return crypto.timingSafeEqual(hash, storedHashBuffer)
  }

  generateId(): string {
    return crypto.randomUUID()
  }

  maskSensitiveInfo(text: string): string {
    let masked = text

    masked = masked.replace(/1[3-9]\d{9}/g, '***手机号***')

    masked = masked.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***邮箱***')

    masked = masked.replace(/\d{17}[\dXx]/g, '***身份证***')

    masked = masked.replace(/\d{16,19}/g, '***银行卡***')

    return masked
  }
}
