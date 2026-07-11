# AI 聊天助手

<p align="center">
  <img src="resources/群二维码.jpg" alt="群二维码" width="200">
</p>

<p align="center">
  <b>扫码加入交流群</b>
</p>

一款 Windows 电脑端 AI 聊天助手软件，能够接管微信/QQ 应用的聊天窗口，基于用户以往的聊天习惯自动生成回复内容。

## ✨ 功能特性

### 🤖 多模型支持
- OpenAI (GPT-4o, GPT-4.1 等)
- Anthropic Claude (Claude Sonnet 4, Claude 3.5 等)
- DeepSeek (DeepSeek-V3, DeepSeek-R1)
- 通义千问 (qwen-turbo, qwen-plus, qwen-max)
- Moonshot Kimi (moonshot-v1-8k, 32k, 128k)
- 小米 MiMo (mimo-v2.5-pro 等)
- 自定义 OpenAI 兼容接口

### 💬 消息平台接入

#### 微信接入（支持多种方式）

| 方式 | 稳定性 | 风险 | 费用 | 说明 |
|------|--------|------|------|------|
| **企业微信** | ⭐⭐⭐⭐⭐ | 低（官方支持） | 免费 | 推荐方案，安全合规 |
| **WeChatFerry** | ⭐⭐⭐ | 中（有封号风险） | 免费 | 功能完整，需匹配微信版本 |
| **Wechaty** | ⭐⭐⭐⭐ | 中 | 部分付费 | 多协议支持，社区活跃 |

#### QQ 接入
- **QQ PC 端** - 通过 NapCat 接入（基于 NTQQ 协议）

### 🎯 智能功能
- **AI 自动回复** - 基于上下文和用户风格生成回复
- **聊天风格学习** - 从历史聊天记录中学习用户说话习惯
- **策略控制** - 按联系人/群组粒度控制自动回复
- **回复审核队列** - 支持人工确认后发送
- **打字延迟模拟** - 模拟人类打字速度

### 🔒 安全隐私
- 本地数据加密存储
- API Key 安全保护
- 敏感信息脱敏
- 启动密码保护

## 🚀 快速开始

### 前置要求

- Node.js 20+ 或 22+
- pnpm 9+（推荐）或 npm
- Git

### 安装

```bash
# 克隆仓库
git clone https://github.com/2025101234/ai-chat-assistant.git
cd ai-chat-assistant

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 启动应用

```bash
# 方式一：使用启动脚本（推荐）
# 双击 start.bat

# 方式二：手动启动
# 终端1：启动 Vite 开发服务器
npm run dev

# 终端2：启动 Electron 窗口
set ELECTRON_RENDERER_URL=http://localhost:5173
npx electron .
```

## ⚙️ 配置说明

### 1. 配置 AI 模型

1. 打开应用，点击左侧"模型配置"
2. 点击"添加模型"按钮
3. 选择提供商（如 OpenAI、MiMo 等）
4. 填入 API Key 和其他配置
5. 点击"测试连接"验证
6. 保存配置

#### MiMo Token Plan 配置示例

| 配置项 | 值 |
|--------|-----|
| 提供商 | 小米MiMo |
| 名称 | MiMo官方 |
| API Key | 你的 Token Plan API Key (tp-xxx) |
| API端点 | https://token-plan-cn.xiaomimimo.com/v1/chat/completions |
| 默认模型 | mimo-v2.5-pro |

### 2. 配置微信

在应用中点击"微信设置"，选择适合你的接入方式：

#### 方式一：企业微信（推荐）

**优点**：官方支持，安全合规，可与个人微信消息互通

**配置步骤**：
1. 注册 [企业微信](https://work.weixin.qq.com/)
2. 登录 [企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)
3. 创建"自建应用"，获取以下信息：
   - **CorpID**：企业 ID
   - **CorpSecret**：应用 Secret
   - **AgentId**：应用 AgentId
4. 配置应用的"接收消息"功能：
   - 设置回调 URL（你的服务器地址）
   - 设置 Token 和 EncodingAESKey
5. 在应用中填入上述配置信息
6. 点击"连接微信"

**企业微信与个人微信互通**：
- 在企业微信中添加"微信客服"功能
- 个人微信用户可以通过客服入口与你的应用对话

---

#### 方式二：WeChatFerry

**优点**：免费开源，功能完整

**配置步骤**：
1. 下载 [WeChatFerry](https://github.com/lich0821/WeChatFerry/releases)
2. 确保微信版本为 **3.9.12.51**（[点击下载配套微信](https://github.com/lich0821/WeChatFerry/releases/download/v39.5.2/WeChatSetup-3.9.12.51.exe)）
3. 启动 WeChatFerry 服务端
4. 在应用中配置 WeChatFerry 地址和端口（默认 127.0.0.1:10086）
5. 点击"连接微信"

**注意事项**：
- ⚠️ 使用 Hook 方式存在封号风险
- 需要匹配特定微信版本
- 微信更新可能导致失效

---

#### 方式三：Wechaty

**优点**：多协议支持，社区活跃

**配置步骤**：
1. 选择 Puppet 类型：
   - **wechaty-puppet-wechat4u**：免费，基于网页版（可能受限）
   - **wechaty-puppet-padlocal**：iPad 协议，稳定（需要购买 Token）
   - **wechaty-puppet-service**：云服务（需要购买 Token）
2. 如果使用 Padlocal 或 Service，需要购买 Token：
   - Padlocal: https://pad-local.com/
   - Service: https://wechaty.js.org/docs/puppet-services/
3. 在应用中选择 Puppet 类型并填入 Token
4. 点击"连接微信"
5. 首次连接需要扫码登录

**安装依赖**：
```bash
# 安装 wechaty 和 puppet
npm install wechaty wechaty-puppet-wechat4u

# 或者使用 padlocal
npm install wechaty wechaty-puppet-padlocal
```

---

### 3. 配置 QQ（通过 NapCat）

1. 下载 [NapCatQQ](https://github.com/NapNeko/NapCatQQ/releases)
2. 运行 NapCatInstaller.exe 安装
3. 登录 QQ
4. 在应用中点击"QQ设置"
5. 填入 NapCat HTTP 端口（默认 3000）
6. 点击"连接QQ"

## 📁 项目结构

```
ai-chat-assistant/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本
│   └── services/                # 核心服务
│       ├── database/            # 数据库服务
│       ├── model-adapter/       # 模型适配层
│       ├── wechat/              # 微信服务
│       └── qq/                  # QQ 服务
├── src/                         # React 渲染进程
│   ├── App.tsx                  # 应用入口
│   ├── pages/                   # 页面组件
│   │   ├── Dashboard/           # 控制面板
│   │   ├── ChatMonitor/         # 聊天监控
│   │   ├── ModelConfig/         # 模型配置
│   │   ├── WeChatSettings/      # 微信设置
│   │   ├── QQSettings/          # QQ设置
│   │   └── Settings/            # 系统设置
│   ├── components/              # 公共组件
│   ├── stores/                  # 状态管理
│   └── utils/                   # 工具函数
├── data/                        # 运行时数据（不上传）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── start.bat                    # 启动脚本
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| UI 组件库 | Ant Design 5 |
| 状态管理 | Zustand |
| 样式方案 | TailwindCSS 4 |
| 构建工具 | Vite 6 |
| 桌面框架 | Electron |
| 数据库 | SQLite (sql.js) |
| AI SDK | 原生 fetch + 自定义适配器 |

## 📝 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 运行测试
npm run test:unit

# 构建应用
npm run build
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本项目仅供学习研究使用，请勿用于非法用途。使用第三方工具接入社交平台需遵守相关平台的服务条款和当地法律法规。

## 🔗 相关链接

### 微信接入相关
- [企业微信开发文档](https://developer.work.weixin.qq.com/document/) - 企业微信官方 API
- [WeChatFerry](https://github.com/lich0821/WeChatFerry) - 微信消息收发框架
- [Wechaty](https://wechaty.js.org/) - 多协议聊天机器人 SDK
- [Padlocal Token](https://pad-local.com/) - Wechaty iPad 协议 Token

### QQ 接入相关
- [NapCatQQ](https://github.com/NapNeko/NapCatQQ) - QQ Bot 框架

### AI 模型相关
- [MiMo API](https://mimo.mi.com/) - 小米 MiMo API 平台
