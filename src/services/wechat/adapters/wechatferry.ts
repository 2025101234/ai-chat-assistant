/**
 * WeChatFerry 适配器
 * GitHub: https://github.com/lich0821/WeChatFerry
 * 
 * 使用说明:
 * 1. 下载 WeChatFerry: https://github.com/lich0821/WeChatFerry/releases
 * 2. 启动 WeChatFerry 服务端
 * 3. 配置 host 和 port
 */

import { WeChatAdapter, WeChatConfig, WeChatMessage, WeChatContact, WeChatBackend } from './index'

interface WCFMessage {
  id: number
  ts: number
  sign: string
  type: number
  xml: string
  sender: string
  content: string
  roomid: string
  thumb?: string
  extra?: string
}

export class WeChatFerryAdapter extends WeChatAdapter {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(config: WeChatConfig) {
    super(config)
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    const { host = '127.0.0.1', port = 10086 } = this.config.wcf || {}
    
    try {
      return new Promise((resolve) => {
        this.ws = new WebSocket(`ws://${host}:${port}`)
        
        this.ws.onopen = () => {
          this.connected = true
          this.startHeartbeat()
          resolve({ success: true, message: 'WeChatFerry 连接成功' })
        }
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'message') {
              this.handleMessage(data.data)
            }
          } catch (e) {
            console.error('WCF message parse error:', e)
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('WCF WebSocket error:', error)
          if (!this.connected) {
            resolve({ success: false, message: 'WeChatFerry 连接失败' })
          }
        }
        
        this.ws.onclose = () => {
          this.connected = false
          this.stopHeartbeat()
          this.scheduleReconnect()
        }
        
        // 超时处理
        setTimeout(() => {
          if (!this.connected) {
            resolve({ success: false, message: 'WeChatFerry 连接超时' })
          }
        }, 10000)
      })
    } catch (error: any) {
      return { success: false, message: `连接失败: ${error.message}` }
    }
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat()
    this.stopReconnect()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!this.ws || !this.connected) return false
    
    try {
      this.ws.send(JSON.stringify({
        type: 'sendText',
        data: { wxid: to, content }
      }))
      return true
    } catch {
      return false
    }
  }

  async getContacts(): Promise<WeChatContact[]> {
    if (!this.ws || !this.connected) return []
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve([]), 5000)
      
      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'contacts') {
            clearTimeout(timeout)
            this.ws?.removeEventListener('message', handler)
            resolve(data.data.map((c: any) => ({
              id: c.wxid,
              name: c.name || c.wxid,
              avatar: c.avatar,
              isGroup: c.wxid.endsWith('@chatroom'),
              remark: c.remark
            })))
          }
        } catch {}
      }
      
      this.ws?.addEventListener('message', handler)
      this.ws?.send(JSON.stringify({ type: 'getContacts' }))
    })
  }

  async getGroups(): Promise<WeChatContact[]> {
    const contacts = await this.getContacts()
    return contacts.filter(c => c.isGroup)
  }

  getStatus(): { connected: boolean; backend: WeChatBackend } {
    return {
      connected: this.connected,
      backend: 'wechatferry'
    }
  }

  private handleMessage(data: WCFMessage) {
    if (!this.messageHandler) return

    const message: WeChatMessage = {
      id: String(data.id),
      senderId: data.sender,
      senderName: data.sender,
      content: data.content,
      timestamp: data.ts * 1000,
      type: 'text',
      isGroup: data.roomid.endsWith('@chatroom'),
      groupId: data.roomid.endsWith('@chatroom') ? data.roomid : undefined
    }

    this.messageHandler(message)
  }

  private startHeartbeat() {
    // WCF 通常不需要心跳，但可以定期检查连接状态
  }

  private stopHeartbeat() {
    // 清理心跳
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      if (!this.connected) {
        this.connect()
      }
    }, 5000)
  }

  private stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}
