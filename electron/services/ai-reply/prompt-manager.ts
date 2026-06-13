import log from 'electron-log'

export interface PromptTemplate {
  id: string
  name: string
  template: string
  variables: string[]
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map()

  constructor() {
    this.registerDefaultTemplates()
  }

  private registerDefaultTemplates(): void {
    this.registerTemplate({
      id: 'default-reply',
      name: '默认回复',
      template: `你是一个聊天助手，需要代替用户回复消息。

## 用户的说话风格
{{styleProfile}}

## 当前对话上下文
{{conversationContext}}

## 联系人信息
- 名称：{{contactName}}
- 关系：{{contactRelation}}

## 要求
1. 严格按照用户的说话风格回复，包括用词、语气、表情使用习惯
2. 回复内容要自然、得体，符合当前对话上下文
3. 回复长度参考用户的习惯（通常 {{replyLengthHint}}）
4. 如果遇到不确定应该如何回复的情况，返回 [NEED_HUMAN_REVIEW]

请生成一条回复：`,
      variables: ['styleProfile', 'conversationContext', 'contactName', 'contactRelation', 'replyLengthHint']
    })

    this.registerTemplate({
      id: 'group-reply',
      name: '群聊回复',
      template: `你是一个聊天助手，需要代替用户在群聊中回复消息。

## 用户的说话风格
{{styleProfile}}

## 群聊上下文
{{groupContext}}

## 群组信息
- 群名：{{groupName}}
- 发送者：{{senderName}}

## 要求
1. 严格按照用户的说话风格回复
2. 注意群聊的氛围，不要过于正式
3. 如果是被@的消息，需要明确回复
4. 如果不确定是否应该回复，返回 [NEED_HUMAN_REVIEW]

请生成一条回复：`,
      variables: ['styleProfile', 'groupContext', 'groupName', 'senderName']
    })

    this.registerTemplate({
      id: 'style-analysis',
      name: '风格分析',
      template: `分析以下聊天记录，提取用户的说话风格特征。

## 聊天记录
{{chatHistory}}

## 分析要求
1. 提取常用词汇和短语
2. 分析语气特征（正式度、活泼度）
3. 统计回复长度分布
4. 识别常用的表情和语气词
5. 总结回复模式

请以JSON格式返回分析结果：`,
      variables: ['chatHistory']
    })

    log.info('Default prompt templates registered')
  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id)
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  renderTemplate(id: string, variables: Record<string, string>): string {
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`Template not found: ${id}`)
    }

    let rendered = template.template

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    return rendered
  }
}
