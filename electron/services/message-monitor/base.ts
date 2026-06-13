export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'system'

export type MessageDirection = 'incoming' | 'outgoing'

export type ChatType = 'private' | 'group'

export interface MessageTarget {
  id: string
  type: ChatType
  name?: string
}

export interface SenderInfo {
  id: string
  name: string
  avatar?: string
}

export interface IncomingMessage {
  id: string
  source: MessageTarget
  sender: SenderInfo
  content: string
  messageType: MessageType
  timestamp: number
  isMentioned?: boolean
}

export interface Contact {
  id: string
  name: string
  remark?: string
  avatar?: string
  platform: string
}

export interface Group {
  id: string
  name: string
  memberCount: number
  platform: string
}

export interface ChatRecord {
  id: string
  platform: string
  contactId: string
  contactName: string
  direction: MessageDirection
  content: string
  timestamp: number
  contextIds?: string[]
}

export type MessageCallback = (message: IncomingMessage) => void

export interface PlatformConfig {
  enabled: boolean
  host?: string
  port?: number
  token?: string
  [key: string]: unknown
}

export interface PlatformAdapter {
  platform: 'wechat' | 'qq'
  status: ConnectionStatus

  connect(config: PlatformConfig): Promise<void>
  disconnect(): Promise<void>
  sendMessage(target: MessageTarget, content: string): Promise<boolean>
  onMessage(callback: MessageCallback): void
  getContacts(): Promise<Contact[]>
  getGroups(): Promise<Group[]>
  getHistory(target: MessageTarget, limit: number): Promise<ChatRecord[]>
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  platform: 'wechat' | 'qq'
  status: ConnectionStatus = 'disconnected'
  protected messageCallbacks: MessageCallback[] = []
  protected config: PlatformConfig | null = null

  constructor(platform: 'wechat' | 'qq') {
    this.platform = platform
  }

  abstract connect(config: PlatformConfig): Promise<void>
  abstract disconnect(): Promise<void>
  abstract sendMessage(target: MessageTarget, content: string): Promise<boolean>
  abstract getContacts(): Promise<Contact[]>
  abstract getGroups(): Promise<Group[]>
  abstract getHistory(target: MessageTarget, limit: number): Promise<ChatRecord[]>

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback)
  }

  protected notifyMessage(message: IncomingMessage): void {
    for (const callback of this.messageCallbacks) {
      try {
        callback(message)
      } catch (error) {
        console.error('Message callback error:', error)
      }
    }
  }

  protected setStatus(status: ConnectionStatus): void {
    this.status = status
  }
}
