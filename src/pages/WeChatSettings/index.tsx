import { useState, useEffect } from 'react'
import { Card, Button, Form, Switch, InputNumber, Space, Tag, Alert, message, Divider, List } from 'antd'
import {
  WechatOutlined,
  DisconnectOutlined,
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined
} from '@ant-design/icons'

const WeChatSettings = () => {
  const [status, setStatus] = useState({
    connected: false,
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

  return (
    <div>
      <Card
        title={
          <Space>
            <WechatOutlined />
            <span>微信连接设置</span>
            {status.connected && <Tag color="success">已连接</Tag>}
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
          message="微信接入说明"
          description={
            <div>
              <p>本软件通过 WeChatFerry 接入微信PC端，实现消息监听和自动回复。</p>
              <p><strong>使用前准备：</strong></p>
              <ol>
                <li>确保微信PC端已登录</li>
                <li>微信版本需要是 <b>3.9.12.51</b></li>
                <li>如版本不匹配，<a href="https://github.com/lich0821/WeChatFerry/releases/download/v39.5.2/WeChatSetup-3.9.12.51.exe" target="_blank">点击下载配套微信</a></li>
              </ol>
              <p><strong>使用步骤：</strong></p>
              <ol>
                <li>点击右侧"连接微信"按钮</li>
                <li>等待连接成功</li>
                <li>在"聊天监控"页面查看消息</li>
              </ol>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item name="enabled" label="启用微信功能" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider />

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
        <List>
          <List.Item>
            <span>连接状态：</span>
            {status.connected ? (
              <Tag icon={<CheckCircleOutlined />} color="success">已连接</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">未连接</Tag>
            )}
          </List.Item>
          <List.Item>
            <span>自动回复：</span>
            {status.config.autoReply ? (
              <Tag color="green">开启</Tag>
            ) : (
              <Tag color="red">关闭</Tag>
            )}
          </List.Item>
        </List>
      </Card>
    </div>
  )
}

export default WeChatSettings
