# 模型配置指南

本项目支持多种 AI 模型，你可以根据需求选择合适的模型。

## 支持的模型

### OpenAI
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| GPT-4o | 多模态模型，支持图片 | 通用对话、图片分析 |
| GPT-4.1 | 最新旗舰模型 | 复杂任务、高质量输出 |
| GPT-4.1 mini | 轻量版，速度快 | 日常对话、快速响应 |
| GPT-4.1 nano | 超轻量版 | 简单任务、成本敏感 |
| GPT-3.5 Turbo | 经济实惠 | 日常对话、简单任务 |

**API 端点**: `https://api.openai.com/v1/chat/completions`

---

### Anthropic Claude
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| Claude Sonnet 4 | 平衡性能和速度 | 通用对话、代码生成 |
| Claude 3.5 Sonnet | 高性价比 | 日常对话、文档处理 |
| Claude 3 Opus | 最强能力 | 复杂分析、创意写作 |
| Claude 3 Haiku | 最快速度 | 简单任务、快速响应 |

**API 端点**: `https://api.anthropic.com/v1/messages`

---

### DeepSeek
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| DeepSeek-V3 | 通用模型 | 日常对话、文档处理 |
| DeepSeek-R1 | 推理模型 | 数学、逻辑、代码 |
| DeepSeek-Coder | 代码专用 | 代码生成、调试 |

**API 端点**: `https://api.deepseek.com/v1/chat/completions`

---

### 通义千问
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| qwen-turbo | 快速版 | 日常对话、简单任务 |
| qwen-plus | 增强版 | 复杂任务、高质量输出 |
| qwen-max | 最强版 | 专业分析、创意写作 |
| qwen-long | 长文本 | 文档分析、长对话 |

**API 端点**: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`

---

### Moonshot Kimi
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| moonshot-v1-8k | 8K 上下文 | 日常对话 |
| moonshot-v1-32k | 32K 上下文 | 长文档分析 |
| moonshot-v1-128k | 128K 上下文 | 超长文档处理 |

**API 端点**: `https://api.moonshot.cn/v1/chat/completions`

---

### 小米 MiMo
| 模型 | 说明 | 适用场景 |
|------|------|----------|
| mimo-v2.5-pro | 旗舰模型 | 通用对话、复杂任务 |
| mimo-v2.5 | 标准版 | 日常对话 |
| mimo-v2.5-lite | 轻量版 | 简单任务、快速响应 |

**API 端点**: `https://api.mimo.com/v1/chat/completions`

**Token Plan 端点**: `https://token-plan-cn.xiaomimimo.com/v1/chat/completions`

---

## 配置步骤

### 1. 获取 API Key

根据你选择的模型提供商，前往对应平台获取 API Key：

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **DeepSeek**: https://platform.deepseek.com/
- **通义千问**: https://dashscope.console.aliyun.com/
- **Moonshot**: https://platform.moonshot.cn/
- **小米 MiMo**: https://mimo.mi.com/

### 2. 在应用中配置

1. 打开 AI 聊天助手
2. 进入"模型配置"
3. 点击"添加模型"
4. 选择提供商
5. 填入配置信息：
   - **名称**: 自定义模型名称
   - **API Key**: 你的 API Key
   - **API 端点**: 对应的 API 地址
   - **默认模型**: 选择要使用的模型
6. 点击"测试连接"验证配置
7. 保存配置

### 3. 设置默认模型

1. 在模型列表中，点击模型右侧的"设为默认"
2. 默认模型将用于自动回复

---

## 常见问题

### Q: 提示"API Key 无效"
**A**: 请检查：
1. API Key 是否正确复制
2. API Key 是否已激活
3. 账户是否有余额

### Q: 提示"连接超时"
**A**: 请检查：
1. 网络是否正常
2. API 端点是否正确
3. 是否需要使用代理

### Q: 提示"模型不存在"
**A**: 请检查：
1. 模型名称是否正确
2. 账户是否有权限使用该模型
3. 模型是否已下线

### Q: 响应速度慢
**A**: 可以尝试：
1. 使用更轻量的模型
2. 减少上下文长度
3. 使用国内 API 端点

---

## 费用说明

不同模型的计费方式不同，请参考各平台官方文档：

- **OpenAI**: https://openai.com/pricing
- **Anthropic**: https://www.anthropic.com/pricing
- **DeepSeek**: https://platform.deepseek.com/api-docs/pricing
- **通义千问**: https://help.aliyun.com/zh/model-studio/product-overview/billing
- **Moonshot**: https://platform.moonshot.cn/docs/pricing
- **小米 MiMo**: https://mimo.mi.com/pricing

---

## 推荐配置

### 个人用户（经济实惠）
- **模型**: DeepSeek-V3 或 GPT-3.5 Turbo
- **优势**: 价格低，响应快
- **适用**: 日常对话、简单任务

### 专业用户（高质量）
- **模型**: GPT-4o 或 Claude Sonnet 4
- **优势**: 质量高，功能全
- **适用**: 复杂任务、专业分析

### 开发者（代码相关）
- **模型**: DeepSeek-Coder 或 Claude Sonnet 4
- **优势**: 代码理解能力强
- **适用**: 代码生成、调试

---

## 自定义 OpenAI 兼容接口

如果你有自建的 API 服务，可以使用"自定义 OpenAI 兼容接口"：

1. 选择提供商为"自定义"
2. 填入你的 API 端点
3. 填入 API Key（如果需要）
4. 填入模型名称
5. 测试连接

**兼容的 API 格式**:
```json
{
  "model": "your-model",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```
