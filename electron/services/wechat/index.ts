import { BrowserWindow, ipcMain } from 'electron'
import { EventEmitter } from 'events'
import log from 'electron-log'

export interface WeChatConfig {
  enabled: boolean
  autoReply: boolean
  replyDelay: { min: number; max: number }
}

export class WeChatService extends EventEmitter {
  private config: WeChatConfig
  private connected: boolean = false
  private wcf: any = null
  private mainWindow: BrowserWindow | null = null

  constructor() {
    super()
    this.config = {
      enabled: false,
      autoReply: true,
      replyDelay: { min: 1000, max: 3000 }
    }
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  getConfig(): WeChatConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<WeChatConfig>) {
    this.config = { ...this.config, ...config }
  }

  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    if (this.connected) {
      return { success: true, message: '已连接' }
    }

    try {
      log.info('Connecting to WeChat via WeChatFerry...')
      
      const { Wechatferry } = await import('wechatferry')
      this.wcf = new Wechatferry()
      
      this.wcf.on('message', (msg: any) => {
        log.info('Received WeChat message:', msg)
        if (this.mainWindow) {
          this.mainWindow.webContents.send('wechat:message', msg)
        }
        this.emit('message', msg)
      })

      await this.wcf.start()
      
      this.connected = true
      this.emit('connected')
      
      log.info('WeChat connected successfully')
      return { success: true, message: '微信连接成功！' }
    } catch (error: any) {
      log.error('WeChat connection failed:', error)
      return { success: false, message: `连接失败: ${error.message}` }
    }
  }

  async disconnect(): Promise<void> {
    if (this.wcf) {
      try {
        await this.wcf.stop()
      } catch (error) {
        log.error('WCF disconnect error:', error)
      }
      this.wcf = null
    }
    this.connected = false
    this.emit('disconnected')
    log.info('WeChat disconnected')
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!this.connected || !this.wcf) {
      return false
    }

    try {
      await this.wcf.sendText(to, content)
      return true
    } catch (error) {
      log.error('Send message failed:', error)
      return false
    }
  }

  async getContacts(): Promise<any[]> {
    if (!this.connected || !this.wcf) {
      return []
    }

    try {
      return await this.wcf.getContacts()
    } catch (error) {
      log.error('Get contacts failed:', error)
      return []
    }
  }

  async getGroups(): Promise<any[]> {
    if (!this.connected || !this.wcf) {
      return []
    }

    try {
      const contacts = await this.wcf.getContacts()
      return contacts.filter((c: any) => c.wxid?.endsWith('@chatroom'))
    } catch (error) {
      log.error('Get groups failed:', error)
      return []
    }
  }

  getStatus(): { connected: boolean; config: WeChatConfig } {
    return {
      connected: this.connected,
      config: this.getConfig()
    }
  }
}

export const wechatService = new WeChatService()

export function setupWeChatIPC() {
  ipcMain.handle('wechat:getStatus', () => {
    return wechatService.getStatus()
  })

  ipcMain.handle('wechat:connect', async () => {
    return await wechatService.connect()
  })

  ipcMain.handle('wechat:disconnect', async () => {
    await wechatService.disconnect()
    return { success: true }
  })

  ipcMain.handle('wechat:sendMessage', async (_, { to, content }: { to: string; content: string }) => {
    const success = await wechatService.sendMessage(to, content)
    return { success }
  })

  ipcMain.handle('wechat:getContacts', async () => {
    return await wechatService.getContacts()
  })

  ipcMain.handle('wechat:getGroups', async () => {
    return await wechatService.getGroups()
  })

  ipcMain.handle('wechat:updateConfig', async (_, config: Partial<WeChatConfig>) => {
    wechatService.updateConfig(config)
    return { success: true }
  })
}
