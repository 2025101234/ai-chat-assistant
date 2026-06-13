import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Tag, Table, Button, Space, Progress, message, Input, Modal, List, Avatar } from 'antd'
import {
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  WechatOutlined,
  QqOutlined,
  LinkOutlined,
  DisconnectOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalMessages: 0,
    aiReplies: 0,
    humanReplies: 0,
    successRate: 0
  })
  const [models, setModels] = useState<any[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [wechatConnected, setWechatConnected] = useState(false)
  const [wechatConnecting, setWechatConnecting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const modelsResult = await window.api.invoke('config:getModels')
      setModels(modelsResult || [])
      
      const messagesResult = await window.api.invoke('chat:getHistory', { contactId: 'test', limit: 10 })
      setRecentMessages(messagesResult || [])

      // 加载微信状态
      const wechatStatus = await window.api.invoke('wechat:getStatus')
      setWechatConnected(wechatStatus.connected)
    } catch (error) {
      console.error('Load data failed:', error)
    }
  }

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    message.success(isMonitoring ? '已停止监控' : '已开始监控')
  }

  const handleConnectWeChat = async () => {
    setWechatConnecting(true)
    try {
      const result = await window.api.invoke('wechat:connect')
      if (result.success) {
        message.success(result.message)
        setWechatConnected(true)
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      message.error(`连接失败: ${error.message}`)
    }
    setWechatConnecting(false)
  }

  const handleDisconnectWeChat = async () => {
    try {
      await window.api.invoke('wechat:disconnect')
      message.success('已断开连接')
      setWechatConnected(false)
    } catch (error: any) {
      message.error(`断开失败: ${error.message}`)
    }
  }

  const handleTestAI = () => {
    setTestModalVisible(true)
    setTestMessage('')
    setTestResult('')
  }

  const handleSendTest = async () => {
    if (!testMessage.trim()) {
      message.warning('请输入测试消息')
      return
    }

    setTesting(true)
    setTestResult('')

    try {
      const result = await window.api.invoke('chat:generateReply', {
        contactId: 'test',
        message: testMessage
      })

      setTestResult(result.content)
      message.success('AI回复成功')
    } catch (error: any) {
      message.error(`测试失败: ${error.message}`)
      setTestResult(`错误: ${error.message}`)
    }
    setTesting(false)
  }

  const activeModel = models.find(m => m.is_active)

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总消息数"
              value={stats.totalMessages}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AI回复数"
              value={stats.aiReplies}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="人工回复数"
              value={stats.humanReplies}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AI回复率"
              value={stats.successRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="最近消息" extra={<Button type="link">查看全部</Button>}>
            {recentMessages.length > 0 ? (
              <Table
                columns={[
                  { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (t: number) => new Date(t).toLocaleString() },
                  { title: '联系人', dataIndex: 'contact_name', key: 'contact_name' },
                  { title: '消息', dataIndex: 'content', key: 'content', ellipsis: true },
                  { title: '方向', dataIndex: 'direction', key: 'direction', render: (d: string) => d === 'incoming' ? '收到' : '发送' }
                ]}
                dataSource={recentMessages}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无消息记录
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统状态">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span>监控状态: </span>
                <Tag icon={isMonitoring ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                     color={isMonitoring ? 'success' : 'default'}>
                  {isMonitoring ? '运行中' : '已停止'}
                </Tag>
              </div>
              <div>
                <span>活跃模型: </span>
                <Tag color="blue">{activeModel?.name || '未配置'}</Tag>
              </div>
              <div>
                <span>已配置模型: </span>
                <span>{models.length} 个</span>
              </div>
            </Space>
          </Card>

          <Card title="快捷操作" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block 
                icon={<ThunderboltOutlined />}
                onClick={handleToggleMonitoring}
              >
                {isMonitoring ? '停止监控' : '开始监控'}
              </Button>
              <Button 
                block 
                icon={<RobotOutlined />}
                onClick={handleTestAI}
                disabled={models.length === 0}
              >
                测试AI回复
              </Button>
            </Space>
          </Card>

          <Card title="聊天平台" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {!wechatConnected ? (
                <Button 
                  block 
                  icon={<LinkOutlined />} 
                  style={{ backgroundColor: '#07c160', color: 'white' }}
                  onClick={handleConnectWeChat}
                  loading={wechatConnecting}
                >
                  连接微信
                </Button>
              ) : (
                <Button 
                  block 
                  icon={<DisconnectOutlined />} 
                  danger
                  onClick={handleDisconnectWeChat}
                >
                  断开微信
                </Button>
              )}
              <Button 
                block 
                icon={<SettingOutlined />} 
                onClick={() => navigate('/wechat-settings')}
              >
                微信设置
              </Button>
              <Button block icon={<QqOutlined />} style={{ backgroundColor: '#12b7f5', color: 'white' }} disabled>
                连接QQ（开发中）
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="测试AI回复"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.TextArea
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            placeholder="输入一条消息来测试AI回复..."
            rows={3}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={handleSendTest}
            loading={testing}
            style={{ marginTop: 8 }}
          >
            发送测试
          </Button>
        </div>

        {testResult && (
          <Card title="AI回复" size="small">
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f6ffed', 
              borderRadius: '6px',
              border: '1px solid #b7eb8f'
            }}>
              {testResult}
            </div>
          </Card>
        )}
      </Modal>
    </div>
  )
}

export default Dashboard
