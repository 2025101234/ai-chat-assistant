# 微信接入指南

本项目支持三种微信接入方式，你可以根据需求选择最适合的方案。

## 方式对比

| 特性 | 企业微信 | WeChatFerry | Wechaty |
|------|----------|-------------|---------|
| **稳定性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **安全性** | 高（官方支持） | 中（Hook方式） | 中 |
| **费用** | 免费 | 免费 | 部分付费 |
| **封号风险** | 无 | 有 | 有 |
| **功能完整度** | 高 | 高 | 高 |
| **配置难度** | 中等 | 简单 | 中等 |
| **适用场景** | 生产环境 | 个人测试 | 开发测试 |

---

## 方式一：企业微信（推荐）

### 优势
- ✅ 官方支持，完全合规
- ✅ 无封号风险
- ✅ 可与个人微信消息互通
- ✅ 稳定可靠

### 配置步骤

#### 1. 注册企业微信
1. 访问 https://work.weixin.qq.com/
2. 使用微信扫码注册
3. 完成企业认证（个人也可以注册）

#### 2. 创建自建应用
1. 登录 [企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)
2. 进入"应用管理" → "自建"
3. 点击"创建应用"
4. 填写应用名称和 Logo
5. 记录以下信息：
   - **CorpID**：企业 ID（在"我的企业"页面）
   - **AgentId**：应用 AgentId（创建应用后获得）
   - **Secret**：应用 Secret（创建应用后获得）

#### 3. 配置接收消息
1. 在应用详情页，找到"接收消息"配置
2. 点击"设置API接收"
3. 填写以下信息：
   - **URL**：你的服务器回调地址（如 `https://your-domain.com/api/wecom/callback`）
   - **Token**：自定义一个 Token（如 `mytoken123`）
   - **EncodingAESKey**：随机生成或自定义（43位字符串）
4. 点击"保存"

#### 4. 配置可信域名
1. 在应用详情页，找到"网页授权及JS-SDK"
2. 点击"设置可信域名"
3. 添加你的域名

#### 5. 在应用中配置
1. 打开 AI 聊天助手
2. 进入"微信设置"
3. 选择"企业微信"
4. 填入上述配置信息
5. 点击"连接微信"

### 企业微信与个人微信互通

企业微信支持"微信客服"功能，可以让个人微信用户与你的应用对话：

1. 在企业微信管理后台，进入"应用管理" → "微信客服"
2. 开启微信客服功能
3. 配置客服账号
4. 生成客服链接或二维码
5. 个人微信用户扫码即可与你的应用对话

---

## 方式二：WeChatFerry

### 优势
- ✅ 免费开源
- ✅ 功能完整
- ✅ 配置简单

### 风险提示
- ⚠️ 使用 Hook 方式，存在封号风险
- ⚠️ 需要匹配特定微信版本
- ⚠️ 微信更新可能导致失效

### 配置步骤

#### 1. 下载 WeChatFerry
1. 访问 https://github.com/lich0821/WeChatFerry/releases
2. 下载最新版本的 `WCF.zip`
3. 解压到任意目录

#### 2. 下载配套微信版本
1. 下载微信 3.9.12.51 版本：
   - [点击下载](https://github.com/lich0821/WeChatFerry/releases/download/v39.5.2/WeChatSetup-3.9.12.51.exe)
2. 安装或覆盖安装微信
3. 登录微信

#### 3. 启动 WeChatFerry
1. 运行 `WCF.exe`
2. 等待提示"服务启动成功"
3. 默认监听地址：`127.0.0.1:10086`

#### 4. 在应用中配置
1. 打开 AI 聊天助手
2. 进入"微信设置"
3. 选择"WeChatFerry"
4. 确认服务地址和端口（默认即可）
5. 点击"连接微信"

### 常见问题

**Q: 提示"微信版本不匹配"**
A: 需要使用指定版本的微信，点击上方链接下载

**Q: 连接超时**
A: 确保 WCF.exe 已经启动，并且微信已登录

**Q: 微信更新后无法使用**
A: 等待 WeChatFerry 更新支持新版本，或暂时不更新微信

---

## 方式三：Wechaty

### 优势
- ✅ 多协议支持
- ✅ 社区活跃
- ✅ 功能强大

### Puppet 类型说明

| Puppet | 费用 | 稳定性 | 说明 |
|--------|------|--------|------|
| wechaty-puppet-wechat4u | 免费 | ⭐⭐⭐ | 基于网页版，可能受限 |
| wechaty-puppet-padlocal | 付费 | ⭐⭐⭐⭐⭐ | iPad 协议，最稳定 |
| wechaty-puppet-service | 付费 | ⭐⭐⭐⭐⭐ | 云服务，无需本地环境 |

### 配置步骤

#### 1. 安装依赖
```bash
# 安装 wechaty
npm install wechaty

# 安装 puppet（选择一个）
npm install wechaty-puppet-wechat4u  # 免费
# 或
npm install wechaty-puppet-padlocal  # 付费
# 或
npm install wechaty-puppet-service   # 付费
```

#### 2. 获取 Token（付费 Puppet）

**Padlocal Token**：
1. 访问 https://pad-local.com/
2. 注册账号
3. 购买 Token
4. 复制 Token（格式：`puppet_padlocal_xxxxxxxx`）

**Service Token**：
1. 访问 https://wechaty.js.org/docs/puppet-services/
2. 注册账号
3. 购买 Token
4. 复制 Token

#### 3. 在应用中配置
1. 打开 AI 聊天助手
2. 进入"微信设置"
3. 选择"Wechaty"
4. 选择 Puppet 类型
5. 填入对应的 Token（如果需要）
6. 点击"连接微信"
7. 首次连接需要扫码登录

### 常见问题

**Q: wechat4u 提示"登录受限"**
A: 微信网页版可能被限制，建议使用 padlocal 或 service

**Q: 扫码后无法登录**
A: 确保手机微信可以正常登录，然后重新扫码

**Q: Token 无效**
A: 检查 Token 是否正确，是否已过期

---

## 推荐选择

### 个人用户（推荐企业微信）
- 注册企业微信（个人也可以）
- 创建自建应用
- 使用微信客服功能与个人微信互通
- 优点：安全、稳定、无封号风险

### 开发测试（推荐 WeChatFerry）
- 下载 WeChatFerry 和配套微信
- 启动服务即可使用
- 优点：免费、配置简单

### 需要多协议（推荐 Wechaty）
- 购买 Padlocal Token
- 使用 iPad 协议
- 优点：最稳定、功能最全

---

## 技术支持

如有问题，请在 GitHub Issues 中反馈：
https://github.com/2025101234/ai-chat-assistant/issues
