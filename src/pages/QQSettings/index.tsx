import { useState, useEffect } from 'react'
import { Card, Button, Form, Switch, InputNumber, Space, Tag, Alert, message, Divider, List, Input } from 'antd'
import {
  QqOutlined,
  DisconnectOutlined,
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined
} from '@ant-design/icons'

const QQSettings = () => {
  const [status, setStatus] = useState({
    connected: false,
    config: {
      enabled: false,
      apiPort: 3000,
      token: '',
      autoReply: true,
      replyDelay: { min: 1000, max: 3000 }
    }
  })
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const result = await window.api.invoke('qq:getStatus')
      setStatus(result)
      form.setFieldsValue({
        enabled: result.config.enabled,
        apiPort: result.config.apiPort,
        token: result.config.token,
        autoReply: result.config.autoReply,
        replyDelayMin: result.config.replyDelay.min,
        replyDelayMax: result.config.replyDelay.max
      })

      if (result.connected) {
        const info = await window.api.invoke('qq:getUserInfo')
        setUserInfo(info)
      }
    } catch (error) {
      console.error('Load QQ status failed:', error)
    }
    setLoading(false)
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const result = await window.api.invoke('qq:connect')
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
      await window.api.invoke('qq:disconnect')
      message.success('已断开连接')
      setUserInfo(null)
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
        apiPort: values.apiPort,
        token: values.token,
        autoReply: values.autoReply,
        replyDelay: {
          min: values.replyDelayMin,
          max: values.replyDelayMax
        }
      }

      await window.api.invoke('qq:updateConfig', config)
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
            <QqOutlined />
            <span>QQ连接设置</span>
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
                style={{ backgroundColor: '#12b7f5', borderColor: '#12b7f5' }}
              >
                连接QQ
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
          message="QQ接入说明（基于NapCat）"
          description={
            <div>
              <p>本软件通过 NapCat 接入QQ，实现消息监听和自动回复。</p>
              <p><strong>使用前准备：</strong></p>
              <ol>
                <li>下载 NapCat: <a href="https://github.com/NapNeko/NapCatQQ/releases" target="_blank">GitHub Releases</a></li>
                <li>运行 NapCatInstaller.exe 安装</li>
                <li>登录QQ，NapCat 会自动启动</li>
                <li>默认HTTP端口：3000</li>
              </ol>
              <p><strong>默认端口配置：</strong></p>
              <ul>
                <li>API端口：3000（NapCat HTTP接口）</li>
                <li>回调端口：3001（接收消息）</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item name="enabled" label="启用QQ功能" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="API端口（NapCat HTTP端口）">
            <Form.Item name="apiPort" noStyle>
              <InputNumber min={1000} max={65535} style={{ width: '100%' }} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Token（NapCat访问令牌，可选）">
            <Form.Item name="token" noStyle>
              <Input.Password placeholder="留空表示无令牌" />
            </Form.Item>
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
            <span>API端口：</span>
            <Tag color="blue">{status.config.apiPort}</Tag>
          </List.Item>
          <List.Item>
            <span>自动回复：</span>
            {status.config.autoReply ? (
              <Tag color="green">开启</Tag>
            ) : (
              <Tag color="red">关闭</Tag>
            )}
          </List.Item>
          {userInfo && (
            <>
              <Divider />
              <List.Item>
                <span>QQ昵称：</span>
                <span>{userInfo.nickname || '未知'}</span>
              </List.Item>
              <List.Item>
                <span>QQ号：</span>
                <span>{userInfo.user_id || '未知'}</span>
              </List.Item>
            </>
          )}
        </List>
      </Card>
    </div>
  )
}

export default QQSettings
