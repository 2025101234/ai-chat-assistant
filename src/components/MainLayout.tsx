import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, theme, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  BulbOutlined,
  SettingOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  WechatOutlined,
  QqOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '控制面板'
    },
    {
      key: '/chat-monitor',
      icon: <MessageOutlined />,
      label: '聊天监控'
    },
    {
      key: '/review-queue',
      icon: <CheckCircleOutlined />,
      label: '审核队列'
    },
    {
      key: '/model-config',
      icon: <RobotOutlined />,
      label: '模型配置'
    },
    {
      key: '/wechat-settings',
      icon: <WechatOutlined />,
      label: '微信设置'
    },
    {
      key: '/qq-settings',
      icon: <QqOutlined />,
      label: 'QQ设置'
    },
    {
      key: '/style-learning',
      icon: <BulbOutlined />,
      label: '风格学习'
    },
    {
      key: '/data-manage',
      icon: <DatabaseOutlined />,
      label: '数据管理'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ]

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!collapsed && <span style={{ color: 'white', fontWeight: 'bold' }}>AI聊天助手</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar style={{ backgroundColor: '#1890ff', cursor: 'pointer', marginRight: 20 }} icon={<UserOutlined />} />
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
