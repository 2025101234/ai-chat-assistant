import { BrowserWindow, ipcMain } from 'electron'
import { EventEmitter } from 'events'
import http from 'http'
import axios from 'axios'
import log from 'electron-log'

export interface QQConfig {
  enabled: boolean
  apiPort: number
  token: string
  autoReply: boolean
  replyDelay: { min: number; max: number }
}

export interface QQMessage {
  id: string
  sender: string
  senderName: string
  content: string
  timestamp: number
  isGroup: boolean
  groupId?: string
  groupName?: string
  type: string
}

export class QQService extends EventEmitter {
  private config: QQConfig
  private connected: boolean = false
  private httpServer: http.Server | null = null
  private mainWindow: BrowserWindow | null = null
  private apiBase: string = ''

  constructor() {
    super()
    this.config = {
      enabled: false,
      apiPort: 3000,
      token: '',
      autoReply: true,
      replyDelay: { min: 1000, max: 3000 }
    }
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  getConfig(): QQConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<QQConfig>) {
    this.config = { ...this.config, ...config }
    this.apiBase = `http://127.0.0.1:${this.config.apiPort}`
  }

  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    if (this.connected) {
      return { success: true, message: '已连接' }
    }

    try {
      log.info('Connecting to QQ via NapCat...')
      
      this.apiBase = `http://127.0.0.1:${this.config.apiPort}`
      
      // 测试连接
      const testResult = await this.testConnection()
      if (!testResult) {
        throw new Error('无法连接到NapCat，请确保NapCat已启动')
      }

      // 启动消息监听服务器
      await this.startCallbackServer()

      this.connected = true
      this.emit('connected')
      
      log.info('QQ connected successfully')
      return { success: true, message: 'QQ连接成功！' }
    } catch (error: any) {
      log.error('QQ connection failed:', error)
      return { success: false, message: `连接失败: ${error.message}` }
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {}
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }
      const response = await axios.get(`${this.apiBase}/get_login_info`, { headers, timeout: 5000 })
      return response.data?.status === 'ok'
    } catch (error) {
      log.error('Connection test failed:', error)
      return false
    }
  }

  private async startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const event = JSON.parse(body)
              this.handleEvent(event)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ status: 'ok' }))
            } catch (error) {
              log.error('Failed to parse event:', error)
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
        } else {
          res.writeHead(200)
          res.end('NapCat Callback Server Running')
        }
      })

      const callbackPort = this.config.apiPort + 1
      this.httpServer.listen(callbackPort, () => {
        log.info(`QQ callback server listening on port ${callbackPort}`)
        resolve()
      })

      this.httpServer.on('error', (error) => {
        log.error('Callback server error:', error)
        reject(error)
      })
    })
  }

  private handleEvent(event: any) {
    if (event.post_type === 'message') {
      const message: QQMessage = {
        id: event.message_id?.toString() || Date.now().toString(),
        sender: event.user_id?.toString() || '',
        senderName: event.sender?.nickname || event.sender?.card || '',
        content: this.extractTextContent(event.message),
        timestamp: event.time ? event.time * 1000 : Date.now(),
        isGroup: event.message_type === 'group',
        groupId: event.group_id?.toString(),
        groupName: '',
        type: event.message_type || 'private'
      }

      log.info('Received QQ message:', message)
      this.emit('message', message)

      if (this.mainWindow) {
        this.mainWindow.webContents.send('qq:message', message)
      }
    }
  }

  private extractTextContent(message: any): string {
    if (typeof message === 'string') return message
    if (Array.isArray(message)) {
      return message
        .filter((seg: any) => seg.type === 'text')
        .map((seg: any) => seg.data?.text || '')
        .join('')
    }
    return ''
  }

  async disconnect(): Promise<void> {
    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }
    this.connected = false
    this.emit('disconnected')
    log.info('QQ disconnected')
  }

  async sendMessage(target: string, content: string, isGroup: boolean = false): Promise<boolean> {
    if (!this.connected) {
      log.warn('Cannot send message: not connected')
      return false
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }

      const endpoint = isGroup ? 'send_group_msg' : 'send_private_msg'
      const params = isGroup
        ? { group_id: parseInt(target), message: content }
        : { user_id: parseInt(target), message: content }

      const response = await axios.post(`${this.apiBase}/${endpoint}`, params, { headers })

      if (response.data?.status === 'ok') {
        this.emit('messageSent', { target, content, timestamp: Date.now() })
        return true
      }
      return false
    } catch (error) {
      log.error('Send message failed:', error)
      return false
    }
  }

  async getContacts(): Promise<any[]> {
    if (!this.connected) return []

    try {
      const headers: Record<string, string> = {}
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }
      const response = await axios.get(`${this.apiBase}/get_friend_list`, { headers })
      return response.data?.data || []
    } catch (error) {
      log.error('Get contacts failed:', error)
      return []
    }
  }

  async getGroups(): Promise<any[]> {
    if (!this.connected) return []

    try {
      const headers: Record<string, string> = {}
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }
      const response = await axios.get(`${this.apiBase}/get_group_list`, { headers })
      return response.data?.data || []
    } catch (error) {
      log.error('Get groups failed:', error)
      return []
    }
  }

  async getUserInfo(): Promise<any> {
    if (!this.connected) return null

    try {
      const headers: Record<string, string> = {}
      if (this.config.token) {
        headers['Authorization'] = `Bearer ${this.config.token}`
      }
      const response = await axios.get(`${this.apiBase}/get_login_info`, { headers })
      return response.data?.data || null
    } catch (error) {
      log.error('Get user info failed:', error)
      return null
    }
  }

  getStatus(): { connected: boolean; config: QQConfig } {
    return {
      connected: this.connected,
      config: this.getConfig()
    }
  }
}

export const qqService = new QQService()

export function setupQQIPC() {
  ipcMain.handle('qq:getStatus', () => {
    return qqService.getStatus()
  })

  ipcMain.handle('qq:connect', async () => {
    return await qqService.connect()
  })

  ipcMain.handle('qq:disconnect', async () => {
    await qqService.disconnect()
    return { success: true }
  })

  ipcMain.handle('qq:sendMessage', async (_, { target, content, isGroup }: { target: string; content: string; isGroup: boolean }) => {
    const success = await qqService.sendMessage(target, content, isGroup)
    return { success }
  })

  ipcMain.handle('qq:getContacts', async () => {
    return await qqService.getContacts()
  })

  ipcMain.handle('qq:getGroups', async () => {
    return await qqService.getGroups()
  })

  ipcMain.handle('qq:getUserInfo', async () => {
    return await qqService.getUserInfo()
  })

  ipcMain.handle('qq:updateConfig', async (_, config: Partial<QQConfig>) => {
    qqService.updateConfig(config)
    return { success: true }
  })
}
