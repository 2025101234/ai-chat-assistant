/**
 * 微信多后端服务
 * 支持: WeChatFerry、企业微信、Wechaty
 */

export type WeChatBackend = 'wechatferry' | 'wecom' | 'wechaty'

export interface WeChatConfig {
  backend: WeChatBackend
  // WeChatFerry 配置
  wcf?: {
    host: string
    port: number
  }
  // 企业微信配置
  wecom?: {
    corpId: string
    corpSecret: string
    agentId: string
    token: string
    encodingAESKey: string
  }
  // Wechaty 配置
  wechaty?: {
    puppet: 'wechaty-puppet-wechat4u' | 'wechaty-puppet-padlocal' | 'wechaty-puppet-service'
    token?: string // PuppetService 需要
    puppetPadlocalToken?: string // Padlocal 需要
  }
}

export interface WeChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  isGroup: boolean
  groupId?: string
  groupName?: string
}

export interface WeChatContact {
  id: string
  name: string
  avatar?: string
  isGroup: boolean
  remark?: string
}

export abstract class WeChatAdapter {
  protected config: WeChatConfig
  protected connected: boolean = false
  protected messageHandler: ((msg: WeChatMessage) => void) | null = null

  constructor(config: WeChatConfig) {
    this.config = config
  }

  abstract connect(): Promise<{ success: boolean; message: string }>
  abstract disconnect(): Promise<void>
  abstract sendMessage(to: string, content: string): Promise<boolean>
  abstract getContacts(): Promise<WeChatContact[]>
  abstract getGroups(): Promise<WeChatContact[]>
  abstract getStatus(): { connected: boolean; backend: WeChatBackend }

  onMessage(handler: (msg: WeChatMessage) => void) {
    this.messageHandler = handler
  }

  isConnected(): boolean {
    return this.connected
  }
}
