/**
 * 企业微信适配器
 * 文档: https://developer.work.weixin.qq.com/document/
 * 
 * 使用说明:
 * 1. 注册企业微信: https://work.weixin.qq.com/
 * 2. 创建自建应用
 * 3. 获取 corpId、corpSecret、agentId
 * 4. 配置接收消息的 Token 和 EncodingAESKey
 * 5. 设置可信域名和回调URL
 */

import { WeChatAdapter, WeChatConfig, WeChatMessage, WeChatContact, WeChatBackend } from './index'

interface WecomToken {
  access_token: string
  expires_in: number
  expires_at: number
}

export class WeComAdapter extends WeChatAdapter {
  private token: WecomToken | null = null
  private refreshTimer: NodeJS.Timeout | null = null

  constructor(config: WeChatConfig) {
    super(config)
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    const { corpId, corpSecret, agentId } = this.config.wecom || {}
    
    if (!corpId || !corpSecret || !agentId) {
      return { success: false, message: '请配置企业微信的 corpId、corpSecret 和 agentId' }
    }

    try {
      await this.refreshAccessToken()
      this.connected = true
      this.startTokenRefresh()
      return { success: true, message: '企业微信连接成功' }
    } catch (error: any) {
      return { success: false, message: `连接失败: ${error.message}` }
    }
  }

  async disconnect(): Promise<void> {
    this.stopTokenRefresh()
    this.token = null
    this.connected = false
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!this.connected || !this.token) return false

    try {
      const response = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${this.token.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touser: to,
            msgtype: 'text',
            agentid: this.config.wecom?.agentId,
            text: { content }
          })
        }
      )

      const result = await response.json()
      return result.errcode === 0
    } catch {
      return false
    }
  }

  async getContacts(): Promise<WeChatContact[]> {
    if (!this.connected || !this.token) return []

    try {
      const response = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=${this.token.access_token}&id=1`
      )
      const result = await response.json()
      
      if (result.errcode !== 0) return []

      // 获取部门成员
      const members: WeChatContact[] = []
      for (const dept of result.department || []) {
        const memberResponse = await fetch(
          `https://qyapi.weixin.qq.com/cgi-bin/user/simplelist?access_token=${this.token.access_token}&department_id=${dept.id}`
        )
        const memberResult = await memberResponse.json()
        
        if (memberResult.errcode === 0) {
          for (const user of memberResult.userlist || []) {
            members.push({
              id: user.userid,
              name: user.name,
              isGroup: false,
              remark: user.position
            })
          }
        }
      }

      return members
    } catch {
      return []
    }
  }

  async getGroups(): Promise<WeChatContact[]> {
    if (!this.connected || !this.token) return []

    try {
      // 企业微信的群聊需要通过应用消息的 chatid
      // 这里返回应用可见范围内的群聊
      const response = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/list?access_token=${this.token.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 100, status_filter: 0 })
        }
      )

      const result = await response.json()
      
      if (result.errcode !== 0) return []

      return (result.group_chat_list || []).map((g: any) => ({
        id: g.chat_id,
        name: g.name || g.chat_id,
        isGroup: true
      }))
    } catch {
      return []
    }
  }

  getStatus(): { connected: boolean; backend: WeChatBackend } {
    return {
      connected: this.connected && this.token !== null,
      backend: 'wecom'
    }
  }

  // 处理企业微信回调消息（需要在服务器端实现）
  handleCallback(xml: string): WeChatMessage | null {
    // 这里需要解析企业微信的 XML 回调消息
    // 实际实现需要使用 XML 解析库
    // 企业微信会将消息 POST 到配置的回调 URL
    return null
  }

  private async refreshAccessToken(): Promise<void> {
    const { corpId, corpSecret } = this.config.wecom || {}
    
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`
    )
    
    const result = await response.json()
    
    if (result.errcode !== 0) {
      throw new Error(result.errmsg || '获取 access_token 失败')
    }

    this.token = {
      access_token: result.access_token,
      expires_in: result.expires_in,
      expires_at: Date.now() + (result.expires_in - 300) * 1000 // 提前5分钟刷新
    }
  }

  private startTokenRefresh() {
    // 每小时刷新一次 token
    this.refreshTimer = setInterval(() => {
      this.refreshAccessToken().catch(console.error)
    }, 3600000)
  }

  private stopTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}
