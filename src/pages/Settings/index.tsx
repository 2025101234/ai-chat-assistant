import { useState, useEffect } from 'react'
import { Card, Form, Input, Switch, Select, Button, Tabs, TimePicker, InputNumber, message, Space, Alert } from 'antd'
import {
  SaveOutlined,
  LockOutlined,
  BellOutlined,
  ControlOutlined,
  DesktopOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { useAppStore } from '../../stores/app'
import dayjs from 'dayjs'

const { Option } = Select

const Settings = () => {
  const { theme, setTheme } = useAppStore()
  const [generalForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [strategyForm] = Form.useForm()
  const [privacyForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await window.api.invoke('config:get', 'settings')
      if (settings) {
        generalForm.setFieldsValue(settings.general || {})
        notificationForm.setFieldsValue(settings.notification || {})
        strategyForm.setFieldsValue(settings.strategy || {})
        privacyForm.setFieldsValue(settings.privacy || {})
      }
    } catch (error) {
      console.error('Load settings failed:', error)
    }
  }

  const handleSaveGeneral = async (values: any) => {
    setLoading(true)
    try {
      await window.api.invoke('config:set', { key: 'settings.general', value: values })
      if (values.theme) {
        setTheme(values.theme)
      }
      message.success('基本设置已保存')
    } catch (error) {
      message.error('保存失败')
    }
    setLoading(false)
  }

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码不一致')
      return
    }
    
    try {
      await window.api.invoke('config:set', { 
        key: 'password', 
        value: values.newPassword 
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error('密码修改失败')
    }
  }

  const handleSaveNotification = async (values: any) => {
    setLoading(true)
    try {
      await window.api.invoke('config:set', { key: 'settings.notification', value: values })
      message.success('通知设置已保存')
    } catch (error) {
      message.error('保存失败')
    }
    setLoading(false)
  }

  const handleSaveStrategy = async (values: any) => {
    setLoading(true)
    try {
      await window.api.invoke('config:set', { key: 'settings.strategy', value: values })
      message.success('回复策略已保存')
    } catch (error) {
      message.error('保存失败')
    }
    setLoading(false)
  }

  const handleSavePrivacy = async (values: any) => {
    setLoading(true)
    try {
      await window.api.invoke('config:set', { key: 'settings.privacy', value: values })
      message.success('隐私设置已保存')
    } catch (error) {
      message.error('保存失败')
    }
    setLoading(false)
  }

  const handleClearData = async () => {
    message.warning('此功能开发中')
  }

  return (
    <div>
      <Card title="系统设置">
        <Tabs defaultActiveKey="general" items={[
          {
            key: 'general',
            label: <span><DesktopOutlined /> 基本设置</span>,
            children: (
              <Form
                form={generalForm}
                layout="vertical"
                onFinish={handleSaveGeneral}
                initialValues={{
                  theme: theme,
                  language: 'zh-CN',
                  autoStart: false,
                  minimizeToTray: true
                }}
              >
                <Form.Item name="theme" label="主题">
                  <Select>
                    <Option value="light">浅色</Option>
                    <Option value="dark">深色</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="language" label="语言">
                  <Select>
                    <Option value="zh-CN">简体中文</Option>
                    <Option value="en-US">English</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="autoStart" label="开机自启" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="minimizeToTray" label="最小化到托盘" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'security',
            label: <span><LockOutlined /> 安全设置</span>,
            children: (
              <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                <Alert message="设置密码后，启动应用需要输入密码才能使用" type="info" showIcon style={{ marginBottom: 16 }} />
                
                <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
                  <Input.Password placeholder="输入新密码" />
                </Form.Item>

                <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}>
                  <Input.Password placeholder="再次输入新密码" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<LockOutlined />}>
                    设置密码
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'notification',
            label: <span><BellOutlined /> 通知设置</span>,
            children: (
              <Form form={notificationForm} layout="vertical" onFinish={handleSaveNotification}
                initialValues={{
                  enableNotification: true,
                  notificationSound: true,
                  notifyOnLowConfidence: true,
                  notifyOnError: true
                }}
              >
                <Form.Item name="enableNotification" label="启用通知" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="notificationSound" label="通知声音" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="notifyOnLowConfidence" label="低置信度时通知" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="notifyOnError" label="错误时通知" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存通知设置
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'strategy',
            label: <span><ControlOutlined /> 回复策略</span>,
            children: (
              <Form form={strategyForm} layout="vertical" onFinish={handleSaveStrategy}
                initialValues={{
                  defaultReplyMode: 'auto',
                  delayMin: 1000,
                  delayMax: 5000,
                  confidenceThreshold: 0.7,
                  maxContextMessages: 10
                }}
              >
                <Form.Item name="defaultReplyMode" label="默认回复模式">
                  <Select>
                    <Option value="auto">自动回复</Option>
                    <Option value="confirm">人工确认</Option>
                    <Option value="off">关闭</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="delayMin" label="最小延迟 (ms)">
                  <InputNumber min={0} max={30000} step={100} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="delayMax" label="最大延迟 (ms)">
                  <InputNumber min={0} max={30000} step={100} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="confidenceThreshold" label="置信度阈值">
                  <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="maxContextMessages" label="上下文消息数">
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存策略设置
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'privacy',
            label: <span><SafetyOutlined /> 隐私设置</span>,
            children: (
              <Form form={privacyForm} layout="vertical" onFinish={handleSavePrivacy}
                initialValues={{
                  enableDataEncryption: true,
                  enableAuditLog: true,
                  dataRetentionDays: 90
                }}
              >
                <Form.Item name="enableDataEncryption" label="数据加密" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="enableAuditLog" label="审计日志" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="dataRetentionDays" label="数据保留天数">
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                      保存隐私设置
                    </Button>
                    <Button danger onClick={handleClearData}>
                      清除所有数据
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )
          }
        ]} />
      </Card>
    </div>
  )
}

export default Settings
