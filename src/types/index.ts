export interface AppConfig {
  theme: 'light' | 'dark'
  language: string
  autoStart: boolean
  minimizeToTray: boolean
}

export interface ModelInfo {
  id: string
  provider: string
  name: string
  apiKey: string
  endpoint?: string
  defaultModel: string
  isActive: boolean
}

export interface ChatMessage {
  id: string
  chatId: string
  content: string
  direction: 'incoming' | 'outgoing'
  timestamp: number
  isAi: boolean
}

export interface Contact {
  id: string
  name: string
  platform: 'wechat' | 'qq'
  avatar?: string
}

export interface Group {
  id: string
  name: string
  platform: 'wechat' | 'qq'
  memberCount: number
}

export interface StyleProfile {
  userId: string
  contactId?: string
  frequentWords: string[]
  frequentEmojis: string[]
  toneFeatures: {
    formality: number
    liveliness: number
  }
  replyLength: {
    average: number
    min: number
    max: number
  }
}

export interface ReviewItem {
  id: string
  contactName: string
  platform: string
  originalMessage: string
  aiReply: string
  confidence: number
  timestamp: number
  status: 'pending' | 'approved' | 'rejected' | 'edited'
}

export interface SystemStats {
  totalMessages: number
  aiReplies: number
  humanReplies: number
  successRate: number
}

export interface AuditLog {
  id: string
  action: string
  detail: string
  timestamp: number
}

export interface ExportOptions {
  format: 'csv' | 'json'
  dateRange?: [Date, Date]
  dataType?: string
}
