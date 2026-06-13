import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { getDatabase, closeDatabase, run, get, query, saveDatabase } from './services/database/client'
import { v4 as uuidv4 } from 'uuid'
import { setupWeChatIPC, wechatService } from './services/wechat'
import { setupQQIPC, qqService } from './services/qq'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const modelAdapters: Record<string, any> = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (data: any) => ({
      content: data.choices[0].message.content,
      usage: data.usage
    })
  },
  claude: {
    name: 'Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 2000
    }),
    parseResponse: (data: any) => ({
      content: data.content[0].text,
      usage: data.usage
    })
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (data: any) => ({
      content: data.choices[0].message.content,
      usage: data.usage
    })
  },
  qwen: {
    name: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (data: any) => ({
      content: data.choices[0].message.content,
      usage: data.usage
    })
  },
  kimi: {
    name: 'Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (data: any) => ({
      content: data.choices[0].message.content,
      usage: data.usage
    })
  },
  mimo: {
    name: 'MiMo',
    endpoint: 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
    authHeader: 'api-key',
    buildRequest: (model: string, messages: any[]) => ({
      model,
      messages,
      temperature: 1.0,
      max_completion_tokens: 4096
    }),
    parseResponse: (data: any) => ({
      content: data.choices[0].message.content || data.choices[0].message.reasoning_content || '',
      usage: data.usage
    })
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // 设置微信和QQ服务的主窗口引用
    if (mainWindow) {
      wechatService.setMainWindow(mainWindow)
      qqService.setMainWindow(mainWindow)
    }
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createTray(): void {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../resources/icon.ico'))
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow?.show()
      }
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('AI聊天助手')
  tray.setContextMenu(contextMenu)
  
  tray.on('double-click', () => {
    mainWindow?.show()
  })
}

function setupIPC(): void {
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform
    }
  })

  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    mainWindow?.hide()
  })

  ipcMain.handle('config:get', async (_, key: string) => {
    const row = await get('SELECT value FROM system_configs WHERE key = ?', [key])
    return row ? JSON.parse(row.value) : null
  })

  ipcMain.handle('config:set', async (_, { key, value }: { key: string, value: any }) => {
    await run(
      'INSERT OR REPLACE INTO system_configs (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
      [key, JSON.stringify(value)]
    )
    return true
  })

  ipcMain.handle('config:getModels', async () => {
    console.log('config:getModels called')
    const result = await query('SELECT * FROM model_configs ORDER BY created_at DESC')
    console.log('config:getModels result:', result)
    return result
  })

  ipcMain.handle('config:saveModel', async (_, model: any) => {
    if (model.id) {
      await run(
        'UPDATE model_configs SET name=?, provider=?, api_key_enc=?, endpoint=?, default_model=?, is_active=?, updated_at=datetime(\'now\') WHERE id=?',
        [model.name, model.provider, model.apiKey, model.endpoint, model.defaultModel, model.isActive ? 1 : 0, model.id]
      )
    } else {
      const id = uuidv4()
      await run(
        'INSERT INTO model_configs (id, name, provider, api_key_enc, endpoint, default_model, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, model.name, model.provider, model.apiKey, model.endpoint, model.defaultModel, model.isActive ? 1 : 0]
      )
      model.id = id
    }
    return model
  })

  ipcMain.handle('config:deleteModel', async (_, id: string) => {
    await run('DELETE FROM model_configs WHERE id=?', [id])
    return true
  })

  ipcMain.handle('model:test', async (_, { provider, apiKey, endpoint, model }: any) => {
    const adapter = modelAdapters[provider]
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`)
    }

    const targetEndpoint = endpoint || adapter.endpoint
    const testModel = model || adapter.defaultModel || 'mimo-v2.5-pro'
    const requestBody = adapter.buildRequest(testModel, [
      { role: 'system', content: 'You are a helpful assistant. Reply briefly.' },
      { role: 'user', content: 'Say hello in one sentence.' }
    ])

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (adapter.authHeader) {
        headers[adapter.authHeader] = apiKey
      } else if (provider === 'claude') {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const result = adapter.parseResponse(data)
      return { success: true, content: result.content }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('model:chat', async (_, { provider, apiKey, endpoint, model, messages }: any) => {
    const adapter = modelAdapters[provider]
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`)
    }

    const targetEndpoint = endpoint || adapter.endpoint
    const requestBody = adapter.buildRequest(model, messages)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (adapter.authHeader) {
      headers[adapter.authHeader] = apiKey
    } else if (provider === 'claude') {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return adapter.parseResponse(data)
  })

  ipcMain.handle('chat:getHistory', async (_, { contactId, limit }: any) => {
    return await query(
      'SELECT * FROM chat_records WHERE contact_id=? ORDER BY timestamp DESC LIMIT ?',
      [contactId, limit]
    )
  })

  ipcMain.handle('chat:sendMessage', async (_, { contactId, content }: any) => {
    const id = uuidv4()
    await run(
      'INSERT INTO chat_records (id, platform, contact_id, contact_name, direction, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'manual', contactId, contactId, 'outgoing', content, Date.now()]
    )
    return { id, success: true }
  })

  ipcMain.handle('chat:generateReply', async (_, { contactId, message }: any) => {
    const models = await query('SELECT * FROM model_configs WHERE is_active=1 LIMIT 1')
    if (models.length === 0) {
      throw new Error('No active model configured')
    }

    const model = models[0]
    const adapter = modelAdapters[model.provider]
    if (!adapter) {
      throw new Error(`Unknown provider: ${model.provider}`)
    }

    const recentMessages = await query(
      'SELECT * FROM chat_records WHERE contact_id=? ORDER BY timestamp DESC LIMIT 10',
      [contactId]
    )

    const chatMessages = recentMessages.reverse().map((m: any) => ({
      role: m.direction === 'incoming' ? 'user' : 'assistant',
      content: m.content
    }))
    chatMessages.push({ role: 'user', content: message })

    const systemPrompt = `你是一个聊天助手，需要代替用户回复消息。
要求：
1. 回复要自然、得体
2. 符合日常聊天风格
3. 简洁明了
4. 如果不确定如何回复，请回复"需要人工处理"`

    const targetEndpoint = model.endpoint || adapter.endpoint
    const requestBody = adapter.buildRequest(model.default_model, [
      { role: 'system', content: systemPrompt },
      ...chatMessages
    ])

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (adapter.authHeader) {
      headers[adapter.authHeader] = model.api_key_enc
    } else if (model.provider === 'claude') {
      headers['x-api-key'] = model.api_key_enc
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${model.api_key_enc}`
    }

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return adapter.parseResponse(data)
  })

  ipcMain.handle('style:import', async (_, filePath: string) => {
    return { success: false, message: '功能开发中' }
  })

  ipcMain.handle('style:analyze', async () => {
    return { success: false, message: '功能开发中' }
  })

  ipcMain.handle('style:getProfile', async () => {
    return null
  })

  // 设置微信服务IPC
  setupWeChatIPC()
  
  // 设置QQ服务IPC
  setupQQIPC()
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ai-chat-assistant')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await getDatabase()
  createWindow()
  createTray()
  setupIPC()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
