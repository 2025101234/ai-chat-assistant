import { useState, useEffect } from 'react'
import { Card, List, Input, Button, Tag, Avatar, Space, Typography, Badge, Empty, message } from 'antd'
import {
  SendOutlined,
  RobotOutlined,
  WechatOutlined,
  QqOutlined
} from '@ant-design/icons'

const { Text } = Typography

interface ChatItem {
  id: string
  name: string
  platform: 'wechat' | 'qq'
  lastMessage: string
  time: string
  unread: number
}

interface Message {
  id: string
  chatId: string
  content: string
  direction: 'incoming' | 'outgoing'
  timestamp: number
  isAi?: boolean
}

const ChatMonitor = () => {
  const [chatList, setChatList] = useState<ChatItem[]>([
    { id: 'test', name: '测试对话', platform: 'wechat', lastMessage: '点击开始测试', time: '现在', unread: 0 }
  ])
  const [activeChat, setActiveChat] = useState<string | null>('test')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat)
    }
  }, [activeChat])

  const loadMessages = async (chatId: string) => {
    try {
      const history = await window.api.invoke('chat:getHistory', { contactId: chatId, limit: 50 })
      if (history && history.length > 0) {
        setMessages(history.map((h: any) => ({
          id: h.id,
          chatId: h.contact_id,
          content: h.content,
          direction: h.direction,
          timestamp: h.timestamp,
          isAi: h.is_ai_reply === 1
        })))
      } else {
        setMessages([{
          id: 'welcome',
          chatId: chatId,
          content: '欢迎使用AI聊天助手！你可以在这里测试AI回复功能。',
          direction: 'incoming',
          timestamp: Date.now()
        }])
      }
    } catch (error) {
      console.error('Load messages failed:', error)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChat) return

    const userMessage: Message = {
      id: Date.now().toString(),
      chatId: activeChat,
      content: inputValue,
      direction: 'outgoing',
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setSending(true)

    try {
      await window.api.invoke('chat:sendMessage', {
        contactId: activeChat,
        content: inputValue
      })

      if (aiEnabled) {
        const reply = await window.api.invoke('chat:generateReply', {
          contactId: activeChat,
          message: inputValue
        })

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          chatId: activeChat,
          content: reply.content,
          direction: 'incoming',
          timestamp: Date.now(),
          isAi: true
        }

        setMessages(prev => [...prev, aiMessage])

        await window.api.invoke('chat:sendMessage', {
          contactId: activeChat,
          content: reply.content
        })
      }
    } catch (error: any) {
      message.error(`发送失败: ${error.message}`)
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)' }}>
      <Card
        style={{ width: 300, marginRight: 16, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: 0 }}
        title="聊天列表"
      >
        <List
          dataSource={chatList}
          renderItem={item => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: activeChat === item.id ? '#e6f7ff' : 'transparent'
              }}
              onClick={() => setActiveChat(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={item.unread}>
                    <Avatar icon={item.platform === 'wechat' ? <WechatOutlined /> : <QqOutlined />} />
                  </Badge>
                }
                title={
                  <Space>
                    <span>{item.name}</span>
                    <Tag color={item.platform === 'wechat' ? 'green' : 'blue'} style={{ fontSize: 10 }}>
                      {item.platform === 'wechat' ? '微信' : 'QQ'}
                    </Tag>
                  </Space>
                }
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text ellipsis style={{ flex: 1 }}>{item.lastMessage}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
        title={activeChat ? `与 ${chatList.find(c => c.id === activeChat)?.name} 的对话` : '选择一个聊天'}
        extra={
          activeChat && (
            <Space>
              <Tag 
                color={aiEnabled ? 'green' : 'default'} 
                style={{ cursor: 'pointer' }}
                onClick={() => setAiEnabled(!aiEnabled)}
              >
                AI自动回复: {aiEnabled ? '开启' : '关闭'}
              </Tag>
            </Space>
          )
        }
      >
        {activeChat ? (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f5f5f5' }}>
              {messages.length > 0 ? (
                <List
                  dataSource={messages}
                  renderItem={item => (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: item.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                        marginBottom: 16
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: item.direction === 'outgoing' ? '#1890ff' : '#fff',
                          color: item.direction === 'outgoing' ? '#fff' : '#000',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div>{item.content}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                          {item.isAi && <RobotOutlined style={{ marginRight: 4 }} />}
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                />
              ) : (
                <Empty description="暂无消息" />
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                placeholder="输入消息..."
                style={{ flex: 1 }}
                disabled={sending}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                loading={sending}
              >
                发送
              </Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="请从左侧选择一个聊天" />
          </div>
        )}
      </Card>
    </div>
  )
}

export default ChatMonitor
