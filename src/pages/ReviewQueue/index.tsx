import { useState } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Input, Typography, Empty, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  RobotOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { TextArea } = Input

interface ReviewItem {
  id: string
  contactName: string
  platform: string
  originalMessage: string
  aiReply: string
  confidence: number
  timestamp: number
  status: 'pending' | 'approved' | 'rejected' | 'edited'
}

const ReviewQueue = () => {
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editedReply, setEditedReply] = useState('')

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([
    {
      id: '1',
      contactName: '张三',
      platform: 'wechat',
      originalMessage: '明天有空吗？一起吃饭',
      aiReply: '好的，明天几点？在哪里见？',
      confidence: 0.85,
      timestamp: Date.now() - 300000,
      status: 'pending'
    },
    {
      id: '2',
      contactName: '工作群',
      platform: 'wechat',
      originalMessage: '下午3点开会，大家准时参加',
      aiReply: '收到，我会准时参加的',
      confidence: 0.92,
      timestamp: Date.now() - 600000,
      status: 'pending'
    },
    {
      id: '3',
      contactName: '李四',
      platform: 'qq',
      originalMessage: '这个文件帮我看看',
      aiReply: '[NEED_HUMAN_REVIEW]',
      confidence: 0.3,
      timestamp: Date.now() - 900000,
      status: 'pending'
    }
  ])

  const handleApprove = (id: string) => {
    setReviewItems(items =>
      items.map(item =>
        item.id === id ? { ...item, status: 'approved' } : item
      )
    )
  }

  const handleReject = (id: string) => {
    setReviewItems(items =>
      items.map(item =>
        item.id === id ? { ...item, status: 'rejected' } : item
      )
    )
  }

  const handleEdit = (item: ReviewItem) => {
    setSelectedItem(item)
    setEditedReply(item.aiReply)
    setEditModalVisible(true)
  }

  const handleSaveEdit = () => {
    if (selectedItem) {
      setReviewItems(items =>
        items.map(item =>
          item.id === selectedItem.id
            ? { ...item, aiReply: editedReply, status: 'edited' }
            : item
        )
      )
    }
    setEditModalVisible(false)
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 120
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: string) => (
        <Tag color={platform === 'wechat' ? 'green' : 'blue'}>
          {platform === 'wechat' ? '微信' : 'QQ'}
        </Tag>
      )
    },
    {
      title: '原始消息',
      dataIndex: 'originalMessage',
      key: 'originalMessage',
      ellipsis: true
    },
    {
      title: 'AI回复',
      dataIndex: 'aiReply',
      key: 'aiReply',
      ellipsis: true,
      render: (text: string, record: ReviewItem) => (
        <Space>
          {record.confidence < 0.5 && (
            <Tooltip title="置信度低，建议人工审核">
              <RobotOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Space>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence: number) => (
        <Tag color={confidence >= 0.8 ? 'green' : confidence >= 0.5 ? 'orange' : 'red'}>
          {(confidence * 100).toFixed(0)}%
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'orange', text: '待审核' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已拒绝' },
          edited: { color: 'blue', text: '已编辑' }
        }
        const s = statusMap[status as keyof typeof statusMap]
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ReviewItem) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status !== 'pending' && (
            <Button size="small" icon={<EyeOutlined />}>
              查看
            </Button>
          )}
        </Space>
      )
    }
  ]

  const pendingCount = reviewItems.filter(i => i.status === 'pending').length

  return (
    <div>
      <Card
        title={
          <Space>
            <span>审核队列</span>
            <Tag color="orange">{pendingCount} 条待审核</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button type="primary">全部通过</Button>
            <Button>批量操作</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reviewItems}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="编辑AI回复"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        {selectedItem && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>原始消息：</Text>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginTop: 8 }}>
                {selectedItem.originalMessage}
              </div>
            </div>
            <div>
              <Text strong>AI回复：</Text>
              <TextArea
                value={editedReply}
                onChange={e => setEditedReply(e.target.value)}
                rows={4}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReviewQueue
