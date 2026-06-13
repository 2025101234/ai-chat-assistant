import { ChatRecord } from '../message-monitor/base'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
}

export class ChatImporter {
  async importFromCSV(filePath: string): Promise<ImportResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      const records: ChatRecord[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const fields = this.parseCSVLine(line)
          if (fields.length >= 5) {
            records.push({
              id: uuidv4(),
              platform: fields[0] || 'unknown',
              contactId: fields[1] || '',
              contactName: fields[2] || '',
              direction: (fields[3] as 'incoming' | 'outgoing') || 'incoming',
              content: fields[4] || '',
              timestamp: parseInt(fields[5]) || Date.now()
            })
          }
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        imported: records.length,
        failed: errors.length,
        errors
      }
    } catch (error) {
      log.error('CSV import failed:', error)
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [`Failed to read file: ${error}`]
      }
    }
  }

  async importFromJSON(filePath: string): Promise<ImportResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      if (!Array.isArray(data)) {
        return {
          success: false,
          imported: 0,
          failed: 0,
          errors: ['JSON file must contain an array']
        }
      }

      const records: ChatRecord[] = []
      const errors: string[] = []

      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i]
          records.push({
            id: item.id || uuidv4(),
            platform: item.platform || 'unknown',
            contactId: item.contactId || item.contact_id || '',
            contactName: item.contactName || item.contact_name || '',
            direction: item.direction || 'incoming',
            content: item.content || '',
            timestamp: item.timestamp || Date.now()
          })
        } catch (error) {
          errors.push(`Item ${i}: ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        imported: records.length,
        failed: errors.length,
        errors
      }
    } catch (error) {
      log.error('JSON import failed:', error)
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [`Failed to read file: ${error}`]
      }
    }
  }

  async importFromWeChat(dbPath: string): Promise<ImportResult> {
    // TODO: 实际实现需要解密微信数据库
    log.warn('WeChat import not yet implemented')
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: ['WeChat import not yet implemented']
    }
  }

  async importFromQQ(filePath: string): Promise<ImportResult> {
    // TODO: 实际实现需要解析QQ聊天记录
    log.warn('QQ import not yet implemented')
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: ['QQ import not yet implemented']
    }
  }

  private parseCSVLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    fields.push(current.trim())
    return fields
  }
}
