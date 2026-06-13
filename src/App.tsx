import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import ChatMonitor from './pages/ChatMonitor'
import ReviewQueue from './pages/ReviewQueue'
import ModelConfig from './pages/ModelConfig'
import StyleLearning from './pages/StyleLearning'
import Settings from './pages/Settings'
import DataManage from './pages/DataManage'
import WeChatSettings from './pages/WeChatSettings'
import QQSettings from './pages/QQSettings'
import { useAppStore } from './stores/app'

function App() {
  const { theme: appTheme } = useAppStore()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff'
        }
      }}
    >
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat-monitor" element={<ChatMonitor />} />
            <Route path="/review-queue" element={<ReviewQueue />} />
            <Route path="/model-config" element={<ModelConfig />} />
            <Route path="/wechat-settings" element={<WeChatSettings />} />
            <Route path="/qq-settings" element={<QQSettings />} />
            <Route path="/style-learning" element={<StyleLearning />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/data-manage" element={<DataManage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
