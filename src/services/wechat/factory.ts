/**
 * 微信适配器工厂
 * 根据配置创建对应的适配器实例
 */

import { WeChatAdapter, WeChatConfig, WeChatBackend } from './index'
import { WeChatFerryAdapter } from './adapters/wechatferry'
import { WeComAdapter } from './adapters/wecom'
import { WechatyAdapter } from './adapters/wechaty'

export class WeChatAdapterFactory {
  private static instance: WeChatAdapter | null = null

  static create(config: WeChatConfig): WeChatAdapter {
    // 如果已经有实例且后端相同，先断开
    if (this.instance) {
      this.instance.disconnect().catch(console.error)
    }

    let adapter: WeChatAdapter

    switch (config.backend) {
      case 'wechatferry':
        adapter = new WeChatFerryAdapter(config)
        break
      case 'wecom':
        adapter = new WeComAdapter(config)
        break
      case 'wechaty':
        adapter = new WechatyAdapter(config)
        break
      default:
        throw new Error(`未知的微信后端: ${config.backend}`)
    }

    this.instance = adapter
    return adapter
  }

  static getInstance(): WeChatAdapter | null {
    return this.instance
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect()
      this.instance = null
    }
  }

  // 获取所有支持的后端信息
  static getSupportedBackends(): Array<{
    id: WeChatBackend
    name: string
    description: string
    risk: 'low' | 'medium' | 'high'
    free: boolean
    stability: number
  }> {
    return [
      {
        id: 'wechatferry',
        name: 'WeChatFerry',
        description: '基于 PC 微信 Hook，功能完整，免费开源',
        risk: 'medium',
        free: true,
        stability: 3
      },
      {
        id: 'wecom',
        name: '企业微信',
        description: '官方支持，安全合规，可与个人微信互通',
        risk: 'low',
        free: true,
        stability: 5
      },
      {
        id: 'wechaty',
        name: 'Wechaty',
        description: '多协议支持，社区活跃，部分 Puppet 需付费',
        risk: 'medium',
        free: false,
        stability: 4
      }
    ]
  }
}
