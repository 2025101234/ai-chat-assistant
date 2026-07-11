import { useState, useEffect } from 'react'
import { Card, Button, Form, Switch, InputNumber, Input, Select, Space, Tag, Alert, message, Divider, List, Radio, Descriptions, Tabs, Tooltip } from 'antd'
import {
  WechatOutlined,
  DisconnectOutlined,
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  DollarOutlined
} from '@ant-design/icons'

const { TabPane } = Tabs

// 后端配置接口
interface BackendInfo {
  id: string
  name: string
  description: string
  risk: 'low' | 'medium' | 'high'
  free: boolean
  stability: number
  icon: string
}

const backends: BackendInfo[] = [
  {
    id: 'wechatferry',
    name: 'WeChatFerry',
    description: '基于 PC 微信 Hook，功能完整，免费开源',
    risk: 'medium',
    free: true,
    stability: 3,
    icon: '🪝'
  },
  {
    id: 'wecom',
    name: '企业微信',
    description: '官方支持，安全合规，可与个人微信互通',
    risk: 'low',
    free: true,
    stability: 5,
    icon: '🏢'
  },
  {
    id: 'wechaty',
    name: 'Wechaty',
    description: '多协议支持，社区活跃，部分 Puppet 需付费',
    risk: 'medium',
    free: false,
    stability: 4,
    icon: '🤖'
  }
]

const WeChatSettings = () => {
  const [selectedBackend, setSelectedBackend] = useState<string>('wechatferry')
  const [status, setStatus] = useState({
    connected: false,
    backend: '',
    config: {
      enabled: false,
      autoReply: true,
      replyDelay: { min: 1000, max: 3000 }
    }
  })
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const result = await window.api.invoke('wechat:getStatus')
      setStatus(result)
      if (result.backend) {
        setSelectedBackend(result.backend)
      }
      form.setFieldsValue({
        enabled: result.config.enabled,
        autoReply: result.config.autoReply,
        replyDelayMin: result.config.replyDelay.min,
        replyDelayMax: result.config.replyDelay.max
      })
    } catch (error) {
      console.error('Load WeChat status failed:', error)
    }
    setLoading(false)
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      // 先保存后端配置
      const values = await form.validateFields()
      const config = {
        backend: selectedBackend,
        // WeChatFerry 配置
        wcf: selectedBackend === 'wechatferry' ? {
          host: values.wcfHost || '127.0.0.1',
          port: values.wcfPort || 10086
        } : undefined,
        // 企业微信配置
        wecom: selectedBackend === 'wecom' ? {
          corpId: values.wecomCorpId,
          corpSecret: values.wecomCorpSecret,
          agentId: values.wecomAgentId,
          token: values.wecomToken,
          encodingAESKey: values.wecomEncodingAESKey
        } : undefined,
        // Wechaty 配置
        wechaty: selectedBackend === 'wechaty' ? {
          puppet: values.wechatyPuppet,
          token: values.wechatyToken,
          puppetPadlocalToken: values.wechatyPadlocalToken
        } : undefined,
        autoReply: values.autoReply,
        replyDelay: {
          min: values.replyDelayMin,
          max: values.replyDelayMax
        }
      }

      await window.api.invoke('wechat:updateConfig', config)
      const result = await window.api.invoke('wechat:connect')
      
      if (result.success) {
        message.success(result.message)
        loadStatus()
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      message.error(`连接失败: ${error.message}`)
    }
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    try {
      await window.api.invoke('wechat:disconnect')
      message.success('已断开连接')
      loadStatus()
    } catch (error: any) {
      message.error(`断开失败: ${error.message}`)
    }
  }

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields()
      const config = {
        backend: selectedBackend,
        enabled: values.enabled,
        autoReply: values.autoReply,
        replyDelay: {
          min: values.replyDelayMin,
          max: values.replyDelayMax
        }
      }

      await window.api.invoke('wechat:updateConfig', config)
      message.success('配置已保存')
      loadStatus()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green'
      case 'medium': return 'orange'
      case 'high': return 'red'
      default: return 'default'
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  const renderBackendCard = (backend: BackendInfo) => (
    <Card
      key={backend.id}
      hoverable
      style={{
        marginBottom: 16,
        border: selectedBackend === backend.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
      }}
      onClick={() => setSelectedBackend(backend.id)}
    >
      <Card.Meta
        avatar={<span style={{ fontSize: 32 }}>{backend.icon}</span>}
        title={
          <Space>
            <span>{backend.name}</span>
            {selectedBackend === backend.id && <Tag color="blue">已选择</Tag>}
          </Space>
        }
        description={backend.description}
      />
      <div style={{ marginTop: 12 }}>
        <Space>
          <Tooltip title="封号风险">
            <Tag icon={<SafetyOutlined />} color={getRiskColor(backend.risk)}>
              {getRiskText(backend.risk)}
            </Tag>
          </Tooltip>
          <Tooltip title="稳定性">
            <Tag icon={<ThunderboltOutlined />}>
              {'⭐'.repeat(backend.stability)}
            </Tag>
          </Tooltip>
          <Tooltip title="费用">
            <Tag icon={<DollarOutlined />} color={backend.free ? 'green' : 'orange'}>
              {backend.free ? '免费' : '部分付费'}
            </Tag>
          </Tooltip>
        </Space>
      </div>
    </Card>
  )

  const renderBackendConfig = () => {
    switch (selectedBackend) {
      case 'wechatferry':
        return (
          <Card title="WeChatFerry 配置" size="small">
            <Form.Item
              label="服务地址"
              extra="WeChatFerry 服务端运行的地址"
            >
              <Space>
                <Form.Item name="wcfHost" noStyle initialValue="127.0.0.1">
                  <Input placeholder="127.0.0.1" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item name="wcfPort" noStyle initialValue={10086}>
                  <InputNumber min={1} max={65535} placeholder="10086" />
                </Form.Item>
              </Space>
            </Form.Item>
            <Alert
              message="WeChatFerry 使用说明"
              description={
                <div>
                  <p>1. 下载 WeChatFerry: <a href="https://github.com/lich0821/WeChatFerry/releases" target="_blank">GitHub Releases</a></p>
                  <p>2. 确保微信版本匹配（3.9.12.51）</p>
                  <p>3. 启动 WeChatFerry 服务端</p>
                  <p>4. 点击"连接微信"按钮</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        )

      case 'wecom':
        return (
          <Card title="企业微信配置" size="small">
            <Form.Item
              label="企业 ID (CorpID)"
              name="wecomCorpId"
              rules={[{ required: true, message: '请输入企业 ID' }]}
            >
              <Input placeholder="ww1234567890abcdef" />
            </Form.Item>
            <Form.Item
              label="应用 Secret (CorpSecret)"
              name="wecomCorpSecret"
              rules={[{ required: true, message: '请输入应用 Secret' }]}
            >
              <Input.Password placeholder="请输入应用 Secret" />
            </Form.Item>
            <Form.Item
              label="应用 AgentId"
              name="wecomAgentId"
              rules={[{ required: true, message: '请输入应用 AgentId' }]}
            >
              <Input placeholder="1000002" />
            </Form.Item>
            <Form.Item
              label="接收消息 Token"
              name="wecomToken"
              extra="在企业微信管理后台配置回调时设置的 Token"
            >
              <Input placeholder="自定义 Token" />
            </Form.Item>
            <Form.Item
              label="消息加解密密钥"
              name="wecomEncodingAESKey"
              extra="在企业微信管理后台配置回调时设置的 EncodingAESKey"
            >
              <Input.Password placeholder="43 位字符串" />
            </Form.Item>
            <Alert
              message="企业微信使用说明"
              description={
                <div>
                  <p>1. 注册企业微信: <a href="https://work.weixin.qq.com/" target="_blank">work.weixin.qq.com</a></p>
                  <p>2. 创建自建应用，获取 CorpID、Secret、AgentId</p>
                  <p>3. 配置应用的"接收消息"功能，设置回调 URL</p>
                  <p>4. 在"可信域名"中添加你的域名</p>
                  <p>5. 填写上方配置信息，点击"连接微信"</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        )

      case 'wechaty':
        return (
          <Card title="Wechaty 配置" size="small">
            <Form.Item
              label="Puppet 类型"
              name="wechatyPuppet"
              rules={[{ required: true, message: '请选择 Puppet 类型' }]}
              extra="选择适合你的 Puppet 实现"
            >
              <Select placeholder="选择 Puppet">
                <Select.Option value="wechaty-puppet-wechat4u">
                  wechaty-puppet-wechat4u (免费，基于网页版)
                </Select.Option>
                <Select.Option value="wechaty-puppet-padlocal">
                  wechaty-puppet-padlocal (iPad 协议，稳定)
                </Select.Option>
                <Select.Option value="wechaty-puppet-service">
                  wechaty-puppet-service (云服务)
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="PadLocal Token"
              name="wechatyPadlocalToken"
              extra="使用 PadLocal Puppet 时需要，购买地址: https://pad-local.com/"
              dependencies={[['wechatyPuppet']]}
            >
              <Input.Password placeholder="puppet_padlocal_xxxxxxxx" />
            </Form.Item>
            <Form.Item
              label="Service Token"
              name="wechatyToken"
              extra="使用 Service Puppet 时需要，购买地址: https://wechaty.js.org/docs/puppet-services/"
              dependencies={[['wechatyPuppet']]}
            >
              <Input.Password placeholder="puppet_service_xxxxxxxx" />
            </Form.Item>
            <Alert
              message="Wechaty 使用说明"
              description={
                <div>
                  <p>1. 安装依赖: <code>npm install wechaty wechaty-puppet-wechat4u</code></p>
                  <p>2. 选择 Puppet 类型:</p>
                  <ul>
                    <li><b>wechat4u</b>: 免费，基于网页版，可能被限制</li>
                    <li><b>padlocal</b>: iPad 协议，稳定可靠，需要购买 Token</li>
                    <li><b>service</b>: 云服务，最稳定，需要购买 Token</li>
                  </ul>
                  <p>3. 填写对应配置，点击"连接微信"</p>
                  <p>4. 首次连接需要扫码登录</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <WechatOutlined />
            <span>微信连接设置</span>
            {status.connected && <Tag color="success">已连接 ({status.backend})</Tag>}
            {!status.connected && <Tag color="default">未连接</Tag>}
          </Space>
        }
        extra={
          <Space>
            {!status.connected ? (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleConnect}
                loading={connecting}
              >
                连接微信
              </Button>
            ) : (
              <Button
                danger
                icon={<DisconnectOutlined />}
                onClick={handleDisconnect}
              >
                断开连接
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadStatus}>
              刷新状态
            </Button>
          </Space>
        }
      >
        <Alert
          message="选择微信接入方式"
          description="根据你的需求选择合适的微信接入方式。企业微信最安全，WeChatFerry 免费但有风险，Wechaty 功能强大但部分需要付费。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ marginBottom: 24 }}>
          <h3>选择接入方式</h3>
          {backends.map(renderBackendCard)}
        </div>

        <Divider />

        {renderBackendConfig()}

        <Divider />

        <Form form={form} layout="vertical">
          <Form.Item name="enabled" label="启用微信功能" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="autoReply" label="自动回复" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="回复延迟（毫秒）">
            <Space>
              <Form.Item name="replyDelayMin" noStyle>
                <InputNumber min={0} max={10000} placeholder="最小" />
              </Form.Item>
              <span>~</span>
              <Form.Item name="replyDelayMax" noStyle>
                <InputNumber min={0} max={10000} placeholder="最大" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button type="primary" icon={<SettingOutlined />} onClick={handleSaveConfig}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="连接状态" style={{ marginTop: 16 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="连接状态">
            {status.connected ? (
              <Tag icon={<CheckCircleOutlined />} color="success">已连接</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">未连接</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="当前后端">
            {status.backend || '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label="自动回复">
            {status.config.autoReply ? (
              <Tag color="green">开启</Tag>
            ) : (
              <Tag color="red">关闭</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default WeChatSettings
