import { useState } from 'react'
import { Card, Table, Button, Tag, Space, DatePicker, Select, Modal, message, Row, Col, Statistic } from 'antd'
import {
  DownloadOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  DatabaseOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { RangePickerProps } from 'antd/es/date-picker'

const { RangePicker } = DatePicker
const { Option } = Select
const { confirm } = Modal

const DataManage = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const [dataType, setDataType] = useState<string>('all')

  const [stats] = useState({
    totalRecords: 12500,
    chatRecords: 10000,
    aiReplyLogs: 2000,
    styleProfiles: 5,
    auditLogs: 495
  })

  const dataSource = [
    { key: '1', type: '聊天记录', count: 10000, size: '25.6 MB', lastUpdate: '2026-06-12 10:30:00' },
    { key: '2', type: 'AI回复日志', count: 2000, size: '5.2 MB', lastUpdate: '2026-06-12 10:25:00' },
    { key: '3', type: '风格画像', count: 5, size: '0.1 MB', lastUpdate: '2026-06-12 09:00:00' },
    { key: '4', type: '模型配置', count: 3, size: '0.01 MB', lastUpdate: '2026-06-11 15:00:00' },
    { key: '5', type: '审计日志', count: 495, size: '1.2 MB', lastUpdate: '2026-06-12 10:28:00' }
  ]

  const columns = [
    {
      title: '数据类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '记录数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<ExportOutlined />}>
            导出
          </Button>
          <Button size="small" icon={<DeleteOutlined />} danger>
            清理
          </Button>
        </Space>
      )
    }
  ]

  const handleExport = (format: string) => {
    message.info(`开始导出 ${format} 格式数据...`)
    setTimeout(() => {
      message.success('导出完成')
    }, 2000)
  }

  const handleBatchDelete = () => {
    confirm({
      title: '确定删除选中的数据？',
      content: '此操作不可恢复，请谨慎操作',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        message.success('删除成功')
        setSelectedRows([])
      }
    })
  }

  const handleCleanOldData = () => {
    confirm({
      title: '清理旧数据',
      content: '将清理超过90天的数据，确定继续？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        message.success('清理完成')
      }
    })
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={stats.totalRecords}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="聊天记录"
              value={stats.chatRecords}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="AI回复日志"
              value={stats.aiReplyLogs}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="风格画像"
              value={stats.styleProfiles}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="数据管理"
        extra={
          <Space>
            <RangePicker onChange={(dates) => setDateRange(dates as [any, any])} />
            <Select
              value={dataType}
              onChange={setDataType}
              style={{ width: 120 }}
            >
              <Option value="all">全部类型</Option>
              <Option value="chat">聊天记录</Option>
              <Option value="ai_reply">AI回复</Option>
              <Option value="style">风格画像</Option>
              <Option value="audit">审计日志</Option>
            </Select>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<ExportOutlined />} onClick={() => handleExport('csv')}>
            导出CSV
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => handleExport('json')}>
            导出JSON
          </Button>
          <Button icon={<ImportOutlined />}>
            导入数据
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
            批量删除
          </Button>
          <Button onClick={handleCleanOldData}>
            清理旧数据
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={dataSource}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (keys) => setSelectedRows(keys as string[])
          }}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default DataManage
