import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm, Alert } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  ReloadOutlined
} from '@ant-design/icons'

const { Option } = Select

interface ModelConfig {
  id: string
  provider: string
  name: string
  api_key_enc: string
  endpoint: string
  default_model: string
  is_active: number
  status?: 'connected' | 'disconnected' | 'testing'
}

const ModelConfigPage = () => {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [form] = Form.useForm()

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-3.5-turbo'], endpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'claude', name: 'Anthropic Claude', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'], endpoint: 'https://api.anthropic.com/v1/messages' },
    { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'], endpoint: 'https://api.deepseek.com/v1/chat/completions' },
    { id: 'qwen', name: '通义千问', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'], endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
    { id: 'kimi', name: 'Moonshot Kimi', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'], endpoint: 'https://api.moonshot.cn/v1/chat/completions' },
    { id: 'custom', name: '自定义OpenAI兼容', models: [], endpoint: '' }
  ]

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    try {
      console.log('Loading models...')
      console.log('window.api:', window.api)
      if (window.api && window.api.invoke) {
        console.log('Invoking config:getModels...')
        const result = await window.api.invoke('config:getModels')
        console.log('Models result:', result)
        console.log('Result type:', typeof result)
        console.log('Result length:', result?.length)
        setModels(result || [])
      } else {
        console.error('window.api not available')
      }
    } catch (error) {
      console.error('Load models failed:', error)
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingModel(null)
    form.resetFields()
    setTestResult(null)
    setModalVisible(true)
  }

  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model)
    form.setFieldsValue({
      provider: model.provider,
      name: model.name,
      apiKey: model.api_key_enc,
      endpoint: model.endpoint,
      defaultModel: model.default_model
    })
    setTestResult(null)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await window.api.invoke('config:deleteModel', id)
      message.success('删除成功')
      loadModels()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleTest = async (model: ModelConfig) => {
    setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'testing' } : m))
    
    try {
      const result = await window.api.invoke('model:test', {
        provider: model.provider,
        apiKey: model.api_key_enc,
        endpoint: model.endpoint,
        model: model.default_model
      })

      if (result.success) {
        setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'connected' } : m))
        message.success(`测试成功: ${result.content}`)
      } else {
        setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'disconnected' } : m))
        message.error(`测试失败: ${result.error}`)
      }
    } catch (error: any) {
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'disconnected' } : m))
      message.error(`测试失败: ${error.message}`)
    }
  }

  const handleTestInModal = async () => {
    try {
      await form.validateFields(['provider', 'apiKey', 'defaultModel'])
    } catch {
      message.error('请填写必要字段')
      return
    }

    const values = form.getFieldsValue()
    setTestResult(null)
    setTesting(true)
    
    try {
      const result = await window.api.invoke('model:test', {
        provider: values.provider,
        apiKey: values.apiKey,
        endpoint: values.endpoint,
        model: values.defaultModel
      })

      if (result.success) {
        setTestResult({ success: true, message: `连接成功: ${result.content}` })
      } else {
        setTestResult({ success: false, message: `连接失败: ${result.error}` })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: `连接失败: ${error.message}` })
    }
    setTesting(false)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const modelData = {
        id: editingModel?.id || undefined,
        name: values.name,
        provider: values.provider,
        apiKey: values.apiKey,
        endpoint: values.endpoint || '',
        defaultModel: values.defaultModel,
        isActive: true
      }

      await window.api.invoke('config:saveModel', modelData)
      message.success(editingModel ? '更新成功' : '添加成功')
      setModalVisible(false)
      loadModels()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写所有必填字段')
      } else {
        message.error(`保存失败: ${error.message}`)
      }
    }
  }

  const columns = [
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => {
        const p = providers.find(p => p.id === provider)
        return <Tag color="blue">{p?.name || provider}</Tag>
      }
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '默认模型',
      dataIndex: 'default_model',
      key: 'default_model'
    },
    {
      title: 'API端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true,
      render: (endpoint: string, record: ModelConfig) => {
        const p = providers.find(p => p.id === record.provider)
        return endpoint || p?.endpoint || '默认'
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'green' : status === 'testing' ? 'orange' : 'default'} 
             icon={status === 'testing' ? <ReloadOutlined spin /> : undefined}>
          {status === 'connected' ? '已连接' : status === 'testing' ? '测试中' : '未测试'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ModelConfig) => (
        <Space>
          <Button size="small" icon={<ApiOutlined />} onClick={() => handleTest(record)}>
            测试
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const selectedProvider = form.getFieldValue('provider')
  const providerInfo = providers.find(p => p.id === selectedProvider)

  return (
    <div>
      <Card
        title="模型配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加模型
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={models}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无模型配置，点击"添加模型"开始' }}
        />
      </Card>

      <Modal
        title={editingModel ? '编辑模型' : '添加模型'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="provider"
            label="提供商"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select placeholder="选择提供商" onChange={() => {
              form.setFieldValue('defaultModel', undefined)
              form.setFieldValue('endpoint', '')
            }}>
              {providers.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="例如: 我的OpenAI" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password placeholder="输入API Key" />
          </Form.Item>

          <Form.Item
            name="endpoint"
            label="API端点"
            extra={providerInfo ? `默认: ${providerInfo.endpoint}` : '留空使用默认端点'}
          >
            <Input placeholder="留空使用默认端点" />
          </Form.Item>

          <Form.Item
            name="defaultModel"
            label="默认模型"
            rules={[{ required: true, message: '请选择默认模型' }]}
          >
            {providerInfo && providerInfo.models.length > 0 ? (
              <Select placeholder="选择默认模型">
                {providerInfo.models.map(m => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
            ) : (
              <Input placeholder="输入模型名称" />
            )}
          </Form.Item>

          <Form.Item>
            <Button 
              type="dashed" 
              block 
              icon={<ApiOutlined />} 
              onClick={handleTestInModal}
              loading={testing}
            >
              测试连接
            </Button>
          </Form.Item>

          {testResult && (
            <Alert
              type={testResult.success ? 'success' : 'error'}
              message={testResult.message}
              showIcon
            />
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default ModelConfigPage
