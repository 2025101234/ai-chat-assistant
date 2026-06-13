import { CryptoService } from './crypto'
import { get, run } from '../database/client'
import log from 'electron-log'

export interface AuthResult {
  success: boolean
  message?: string
}

export class AuthService {
  private crypto: CryptoService
  private isAuthenticated: boolean = false

  constructor() {
    this.crypto = new CryptoService()
  }

  async setupPassword(password: string): Promise<AuthResult> {
    try {
      const hash = this.crypto.hashPassword(password)

      run(
        'INSERT OR REPLACE INTO system_configs (key, value) VALUES (?, ?)',
        ['password_hash', hash]
      )

      await this.crypto.setMasterPassword(password)
      this.isAuthenticated = true

      log.info('Password setup successful')
      return { success: true }
    } catch (error) {
      log.error('Password setup failed:', error)
      return { success: false, message: `设置密码失败: ${error}` }
    }
  }

  async login(password: string): Promise<AuthResult> {
    try {
      const row = get(
        'SELECT value FROM system_configs WHERE key = ?',
        ['password_hash']
      )

      if (!row) {
        return { success: false, message: '密码未设置' }
      }

      const isValid = this.crypto.verifyPassword(password, row.value)

      if (!isValid) {
        log.warn('Login failed: invalid password')
        return { success: false, message: '密码错误' }
      }

      await this.crypto.setMasterPassword(password)
      this.isAuthenticated = true

      log.info('Login successful')
      return { success: true }
    } catch (error) {
      log.error('Login failed:', error)
      return { success: false, message: `登录失败: ${error}` }
    }
  }

  logout(): void {
    this.isAuthenticated = false
    log.info('User logged out')
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated
  }

  hasPassword(): boolean {
    const row = get(
      'SELECT value FROM system_configs WHERE key = ?',
      ['password_hash']
    )

    return !!row
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const row = get(
        'SELECT value FROM system_configs WHERE key = ?',
        ['password_hash']
      )

      if (!row) {
        return { success: false, message: '密码未设置' }
      }

      const isValid = this.crypto.verifyPassword(oldPassword, row.value)
      if (!isValid) {
        return { success: false, message: '旧密码错误' }
      }

      const newHash = this.crypto.hashPassword(newPassword)
      run(
        'UPDATE system_configs SET value = ? WHERE key = ?',
        [newHash, 'password_hash']
      )

      await this.crypto.setMasterPassword(newPassword)

      log.info('Password changed successfully')
      return { success: true }
    } catch (error) {
      log.error('Change password failed:', error)
      return { success: false, message: `修改密码失败: ${error}` }
    }
  }

  getCryptoService(): CryptoService {
    return this.crypto
  }
}
