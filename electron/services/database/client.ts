import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import log from 'electron-log'

let db: any = null
let dbPath: string = ''
let SQL: any = null

export async function getDatabase(): Promise<any> {
  if (!db) {
    const initSqlJs = require('sql.js')
    SQL = await initSqlJs()
    
    // 数据库存放在项目目录下的data文件夹
    let appDir: string
    if (app.isPackaged) {
      appDir = path.dirname(app.getPath('exe'))
    } else {
      // 开发模式下使用项目根目录
      appDir = process.cwd()
    }
    const dataDir = path.join(appDir, 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    dbPath = path.join(dataDir, 'chat-assistant.db')
    
    log.info('Connecting to database:', dbPath)
    log.info('App dir:', appDir)
    
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
    } else {
      db = new SQL.Database()
    }
    
    initializeDatabase(db)
    saveDatabase()
  }
  
  return db
}

function initializeDatabase(db: any): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_records (
      id            TEXT PRIMARY KEY,
      platform      TEXT NOT NULL,
      contact_id    TEXT NOT NULL,
      contact_name  TEXT,
      direction     TEXT NOT NULL,
      content       TEXT NOT NULL,
      message_type  TEXT DEFAULT 'text',
      sender_id     TEXT,
      sender_name   TEXT,
      is_ai_reply   INTEGER DEFAULT 0,
      timestamp     INTEGER NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_chat_records_contact ON chat_records(contact_id, timestamp DESC)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_chat_records_platform ON chat_records(platform, timestamp DESC)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_reply_logs (
      id              TEXT PRIMARY KEY,
      chat_record_id  TEXT REFERENCES chat_records(id),
      model_used      TEXT NOT NULL,
      prompt_tokens   INTEGER,
      completion_tokens INTEGER,
      latency_ms      INTEGER,
      confidence      REAL,
      status          TEXT NOT NULL,
      original_reply  TEXT,
      final_reply     TEXT,
      error_message   TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS style_profiles (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      contact_id    TEXT,
      profile_data  TEXT NOT NULL,
      version       INTEGER DEFAULT 1,
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_style_profiles_user ON style_profiles(user_id, contact_id)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS model_configs (
      id            TEXT PRIMARY KEY,
      provider      TEXT NOT NULL,
      name          TEXT NOT NULL,
      api_key_enc   TEXT NOT NULL,
      endpoint      TEXT,
      default_model TEXT NOT NULL,
      is_active     INTEGER DEFAULT 1,
      extra_config  TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_policies (
      id              TEXT PRIMARY KEY,
      platform        TEXT NOT NULL,
      contact_id      TEXT NOT NULL,
      auto_reply      INTEGER DEFAULT 1,
      reply_mode      TEXT DEFAULT 'auto',
      model_override  TEXT,
      delay_min_ms    INTEGER DEFAULT 1000,
      delay_max_ms    INTEGER DEFAULT 5000,
      priority        TEXT DEFAULT 'normal',
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_policies ON contact_policies(platform, contact_id)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS system_configs (
      key           TEXT PRIMARY KEY,
      value         TEXT NOT NULL,
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          TEXT PRIMARY KEY,
      action      TEXT NOT NULL,
      detail      TEXT,
      ip_address  TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC)`)

  log.info('Database initialized successfully')
}

export function saveDatabase(): void {
  if (db && dbPath) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
    log.info('Database saved to:', dbPath)
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  await getDatabase()
  if (!db) throw new Error('Database not initialized')
  const stmt = db.prepare(sql)
  stmt.bind(params)
  
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  await getDatabase()
  if (!db) throw new Error('Database not initialized')
  db.run(sql, params)
  saveDatabase()
}

export async function get(sql: string, params: any[] = []): Promise<any | null> {
  const results = await query(sql, params)
  return results.length > 0 ? results[0] : null
}
