import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  currentUser: string | null
  isInitialized: boolean

  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setCurrentUser: (user: string | null) => void
  setInitialized: (initialized: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  sidebarCollapsed: false,
  currentUser: null,
  isInitialized: false,

  setTheme: (theme) => {
    set({ theme })
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentUser: (user) => set({ currentUser: user }),

  setInitialized: (initialized) => set({ isInitialized: initialized })
}))

interface MessageState {
  messages: any[]
  activeChat: string | null
  isMonitoring: boolean

  addMessage: (message: any) => void
  setActiveChat: (chatId: string | null) => void
  setMonitoring: (monitoring: boolean) => void
  clearMessages: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  activeChat: null,
  isMonitoring: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  setActiveChat: (chatId) => set({ activeChat: chatId }),

  setMonitoring: (monitoring) => set({ isMonitoring: monitoring }),

  clearMessages: () => set({ messages: [] })
}))

interface ModelState {
  models: any[]
  activeModel: string | null
  isLoading: boolean

  setModels: (models: any[]) => void
  setActiveModel: (modelId: string | null) => void
  setLoading: (loading: boolean) => void
  addModel: (model: any) => void
  removeModel: (modelId: string) => void
  updateModel: (modelId: string, updates: any) => void
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  activeModel: null,
  isLoading: false,

  setModels: (models) => set({ models }),

  setActiveModel: (modelId) => set({ activeModel: modelId }),

  setLoading: (loading) => set({ isLoading: loading }),

  addModel: (model) => set((state) => ({
    models: [...state.models, model]
  })),

  removeModel: (modelId) => set((state) => ({
    models: state.models.filter(m => m.id !== modelId)
  })),

  updateModel: (modelId, updates) => set((state) => ({
    models: state.models.map(m => m.id === modelId ? { ...m, ...updates } : m)
  }))
}))

interface StyleState {
  profiles: any[]
  currentProfile: any | null
  isLearning: boolean

  setProfiles: (profiles: any[]) => void
  setCurrentProfile: (profile: any | null) => void
  setLearning: (learning: boolean) => void
  addProfile: (profile: any) => void
}

export const useStyleStore = create<StyleState>((set) => ({
  profiles: [],
  currentProfile: null,
  isLearning: false,

  setProfiles: (profiles) => set({ profiles }),

  setCurrentProfile: (profile) => set({ currentProfile: profile }),

  setLearning: (learning) => set({ isLearning: learning }),

  addProfile: (profile) => set((state) => ({
    profiles: [...state.profiles, profile]
  }))
}))

interface StatsState {
  totalMessages: number
  aiReplies: number
  humanReplies: number
  successRate: number

  setStats: (stats: Partial<StatsState>) => void
  incrementMessages: () => void
  incrementAiReplies: () => void
  incrementHumanReplies: () => void
}

export const useStatsStore = create<StatsState>((set) => ({
  totalMessages: 0,
  aiReplies: 0,
  humanReplies: 0,
  successRate: 0,

  setStats: (stats) => set(stats),

  incrementMessages: () => set((state) => ({ totalMessages: state.totalMessages + 1 })),

  incrementAiReplies: () => set((state) => ({
    aiReplies: state.aiReplies + 1,
    successRate: ((state.aiReplies + 1) / (state.totalMessages + 1)) * 100
  })),

  incrementHumanReplies: () => set((state) => ({
    humanReplies: state.humanReplies + 1
  }))
}))
