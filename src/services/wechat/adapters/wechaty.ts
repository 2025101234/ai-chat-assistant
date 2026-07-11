/**
 * Wechaty 适配器
 * 文档: https://wechaty.js.org/
 * 
 * 使用说明:
 * 1. 安装 wechaty: npm install wechaty
 * 2. 选择 Puppet:
 *    - wechaty-puppet-wechat4u: 免费，基于网页版（可能受限）
 *    - wechaty-puppet-padlocal: iPad 协议，稳定（需要 token）
 *    - wechaty-puppet-service: 云服务（需要 token）
 * 3. 配置 puppet 和 token
 */

import { WeChatAdapter, WeChatConfig, WeChatMessage, WeChatContact, WeChatBackend } from './index'

export class WechatyAdapter extends WeChatAdapter {
  private bot: any = null // Wechaty 实例
  private qrCodeCallback: ((qr: string) => void) | null = null

  constructor(config: WeChatConfig) {
    super(config)
  }

  // 设置二维码回调（用于显示登录二维码）
  onQRCode(callback: (qr: string) => void) {
    this.qrCodeCallback = callback
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    const { puppet, token, puppetPadlocalToken } = this.config.wechaty || {}
    
    if (!puppet) {
      return { success: false, message: '请配置 Wechaty Puppet 类型' }
    }

    try {
      // 动态导入 wechaty（避免打包时引入）
      const { Wechaty } = await import('wechaty')
      
      const puppetOptions: any = {}
      
      if (puppet === 'wechaty-puppet-service' && token) {
        puppetOptions.token = token
      } else if (puppet === 'wechaty-puppet-padlocal' && puppetPadlocalToken) {
        puppetOptions.token = puppetPadlocalToken
      }

      this.bot = Wechaty.instance({
        name: 'ai-chat-assistant',
        puppet,
        puppetOptions
      })

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, message: 'Wechaty 连接超时，请检查配置' })
        }, 120000) // 2分钟超时（可能需要扫码）

        this.bot!.on('scan', (qrcode: string, status: number) => {
          if (status === 2) {
            // 已扫码，等待确认
            if (this.qrCodeCallback) {
              this.qrCodeCallback(qrcode)
            }
          }
        })

        this.bot!.on('login', (user: any) => {
          clearTimeout(timeout)
          this.connected = true
          console.log(`Wechaty 登录成功: ${user.name()}`)
          resolve({ success: true, message: `Wechaty 登录成功: ${user.name()}` })
        })

        this.bot!.on('message', (message: any) => {
          this.handleMessage(message)
        })

        this.bot!.on('error', (error: Error) => {
          console.error('Wechaty error:', error)
        })

        this.bot!.on('logout', () => {
          this.connected = false
        })

        this.bot!.start().catch((err: Error) => {
          clearTimeout(timeout)
          resolve({ success: false, message: `启动失败: ${err.message}` })
        })
      })
    } catch (error: any) {
      return { success: false, message: `连接失败: ${error.message}` }
    }
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop()
      this.bot = null
    }
    this.connected = false
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!this.bot || !this.connected) return false

    try {
      const contact = await this.bot.Contact.find({ id: to })
      if (contact) {
        await contact.say(content)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async getContacts(): Promise<WeChatContact[]> {
    if (!this.bot || !this.connected) return []

    try {
      const contacts = await this.bot.Contact.findAll()
      return contacts.map((c: any) => ({
        id: c.id,
        name: c.name(),
        avatar: c.avatar()?.url,
        isGroup: c.type() === this.bot.Contact.Type.Group,
        remark: c.alias()
      }))
    } catch {
      return []
    }
  }

  async getGroups(): Promise<WeChatContact[]> {
    if (!this.bot || !this.connected) return []

    try {
      const rooms = await this.bot.Room.findAll()
      return rooms.map((r: any) => ({
        id: r.id,
        name: r.name() || r.id,
        isGroup: true
      }))
    } catch {
      return []
    }
  }

  getStatus(): { connected: boolean; backend: WeChatBackend } {
    return {
      connected: this.connected,
      backend: 'wechaty'
    }
  }

  private async handleMessage(message: any) {
    if (!this.messageHandler) return

    try {
      const talker = message.talker()
      const room = message.room()
      const type = message.type()

      let msgType: WeChatMessage['type'] = 'text'
      if (type === this.bot.Message.Type.Image) msgType = 'image'
      else if (type === this.bot.Message.Type.Audio) msgType = 'voice'
      else if (type === this.bot.Message.Type.Video) msgType = 'video'
      else if (type === this.bot.Message.Type.Attachment) msgType = 'file'

      const wechatMessage: WeChatMessage = {
        id: message.id,
        senderId: talker?.id || 'unknown',
        senderName: talker?.name() || 'unknown',
        content: message.text(),
        timestamp: message.date().getTime(),
        type: msgType,
        isGroup: !!room,
        groupId: room?.id,
        groupName: room?.name()
      }

      this.messageHandler(wechatMessage)
    } catch (error) {
      console.error('Handle message error:', error)
    }
  }
}
