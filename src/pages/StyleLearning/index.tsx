import { useState } from 'react'
import { Card, Button, Upload, Table, Tag, Space, Progress, Typography, Row, Col, Statistic, message } from 'antd'
import {
  UploadOutlined,
  ImportOutlined,
  BulbOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useStyleStore } from '../../stores/app'

const { Text, Title } = Typography

const StyleLearning = () => {
  const { profiles, isLearning, setLearning, addProfile } = useStyleStore()
  const [importProgress, setImportProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleImport = (file: File) => {
    message.info(`开始导入: ${file.name}`)
    setImportProgress(0)

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          message.success('导入完成')
          return 100
        }
        return prev + 10
      })
    }, 500)

    return false
  }

  const handleLearn = () => {
    setLearning(true)
    message.info('开始学习风格...')

    setTimeout(() => {
      setLearning(false)
      setAnalysisResult({
        frequentWords: ['好的', '哈哈', '嗯嗯', '可以', '没问题'],
        frequentEmojis: ['😊', '👍', '😂', '❤️'],
        toneFeatures: {
          formality: 0.3,
          liveliness: 0.7
        },
        replyLength: {
          average: 25,
          min: 2,
          max: 150
        }
      })
      message.success('风格学习完成')
    }, 5000)
  }

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId'
    },
    {
      title: '联系人',
      dataIndex: 'contactId',
      key: 'contactId',
      render: (contactId: string) => contactId || '全局'
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small">查看</Button>
          <Button size="small" danger>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="聊天记录导入">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                beforeUpload={handleImport}
                showUploadList={false}
                accept=".csv,.json"
              >
                <Button icon={<UploadOutlined />}>选择文件导入</Button>
              </Upload>
              <Text type="secondary">支持 CSV、JSON 格式的聊天记录文件</Text>
              {importProgress > 0 && (
                <Progress percent={importProgress} status={importProgress < 100 ? 'active' : 'success'} />
              )}
            </Space>
          </Card>

          <Card title="风格学习" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>基于导入的聊天记录，分析用户的说话风格特征。</Text>
              </div>
              <Button
                type="primary"
                icon={isLearning ? <LoadingOutlined /> : <BulbOutlined />}
                onClick={handleLearn}
                loading={isLearning}
                disabled={importProgress < 100}
              >
                {isLearning ? '学习中...' : '开始学习'}
              </Button>
            </Space>
          </Card>

          {analysisResult && (
            <Card title="分析结果" style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="常用词汇">
                    {analysisResult.frequentWords.map((word: string, index: number) => (
                      <Tag key={index} color="blue" style={{ margin: 4 }}>{word}</Tag>
                    ))}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="常用表情">
                    {analysisResult.frequentEmojis.map((emoji: string, index: number) => (
                      <span key={index} style={{ fontSize: 24, margin: 4 }}>{emoji}</span>
                    ))}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="语气特征">
                    <Space direction="vertical">
                      <div>
                        <Text>正式度: </Text>
                        <Progress percent={analysisResult.toneFeatures.formality * 100} size="small" />
                      </div>
                      <div>
                        <Text>活泼度: </Text>
                        <Progress percent={analysisResult.toneFeatures.liveliness * 100} size="small" />
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="回复长度">
                    <Space direction="vertical">
                      <Statistic title="平均长度" value={analysisResult.replyLength.average} suffix="字" />
                      <Statistic title="最短" value={analysisResult.replyLength.min} suffix="字" />
                      <Statistic title="最长" value={analysisResult.replyLength.max} suffix="字" />
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="风格画像列表">
            <Table
              columns={columns}
              dataSource={profiles}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="学习状态" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>导入进度: </Text>
                <Progress percent={importProgress} size="small" />
              </div>
              <div>
                <Text>学习状态: </Text>
                <Tag icon={isLearning ? <LoadingOutlined /> : <CheckCircleOutlined />}
                     color={isLearning ? 'processing' : 'success'}>
                  {isLearning ? '学习中' : '已完成'}
                </Tag>
              </div>
              <div>
                <Text>已保存画像: </Text>
                <Text strong>{profiles.length} 个</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StyleLearning
