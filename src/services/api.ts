const { ipcRenderer } = window.electron

export const api = {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  model: {
    test: (provider: string, apiKey: string, endpoint: string, model: string) =>
      ipcRenderer.invoke('model:test', { provider, apiKey, endpoint, model }),
    chat: (provider: string, apiKey: string, endpoint: string, model: string, messages: any[]) =>
      ipcRenderer.invoke('model:chat', { provider, apiKey, endpoint, model, messages }),
    streamChat: (provider: string, apiKey: string, endpoint: string, model: string, messages: any[], callback: (chunk: string) => void) => {
      const channel = 'model:stream-chat:' + Date.now()
      ipcRenderer.on(channel, (_, data) => callback(data))
      ipcRenderer.invoke('model:stream-chat', { provider, apiKey, endpoint, model, messages, channel })
      return () => ipcRenderer.removeAllListeners(channel)
    }
  },
  
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('config:set', { key, value }),
    getModels: () => ipcRenderer.invoke('config:getModels'),
    saveModel: (model: any) => ipcRenderer.invoke('config:saveModel', model),
    deleteModel: (id: string) => ipcRenderer.invoke('config:deleteModel', id)
  },
  
  chat: {
    getHistory: (contactId: string, limit: number) =>
      ipcRenderer.invoke('chat:getHistory', { contactId, limit }),
    sendMessage: (contactId: string, content: string) =>
      ipcRenderer.invoke('chat:sendMessage', { contactId, content }),
    generateReply: (contactId: string, message: string) =>
      ipcRenderer.invoke('chat:generateReply', { contactId, message })
  },
  
  style: {
    import: (filePath: string) => ipcRenderer.invoke('style:import', filePath),
    analyze: () => ipcRenderer.invoke('style:analyze'),
    getProfile: () => ipcRenderer.invoke('style:getProfile')
  }
}
