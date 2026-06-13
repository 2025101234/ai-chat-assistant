import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { AuthService } from '../../electron/services/security/auth'
import { CryptoService } from '../../electron/services/security/crypto'

describe('AuthService Integration', () => {
  let db: Database.Database
  let authService: AuthService

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    authService = new AuthService(db)
  })

  afterEach(() => {
    db.close()
  })

  it('should setup password successfully', async () => {
    const result = await authService.setupPassword('test-password')
    expect(result.success).toBe(true)
    expect(authService.hasPassword()).toBe(true)
  })

  it('should login with correct password', async () => {
    await authService.setupPassword('test-password')
    
    const result = await authService.login('test-password')
    expect(result.success).toBe(true)
    expect(authService.isLoggedIn()).toBe(true)
  })

  it('should reject incorrect password', async () => {
    await authService.setupPassword('test-password')
    
    const result = await authService.login('wrong-password')
    expect(result.success).toBe(false)
    expect(authService.isLoggedIn()).toBe(false)
  })

  it('should change password successfully', async () => {
    await authService.setupPassword('old-password')
    
    const result = await authService.changePassword('old-password', 'new-password')
    expect(result.success).toBe(true)
    
    const loginResult = await authService.login('new-password')
    expect(loginResult.success).toBe(true)
  })

  it('should reject change password with wrong old password', async () => {
    await authService.setupPassword('old-password')
    
    const result = await authService.changePassword('wrong-password', 'new-password')
    expect(result.success).toBe(false)
  })

  it('should logout successfully', async () => {
    await authService.setupPassword('test-password')
    await authService.login('test-password')
    
    authService.logout()
    expect(authService.isLoggedIn()).toBe(false)
  })
})
