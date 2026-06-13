import { ChatRecord } from '../message-monitor/base'
import log from 'electron-log'

export interface StyleProfile {
  userId: string
  frequentWords: WordFrequency[]
  frequentEmojis: string[]
  toneFeatures: ToneFeatures
  replyLengthDistribution: LengthStats
  sentencePatterns: string[]
  scenarioPatterns: ScenarioPattern[]
  lastUpdated: number
}

export interface WordFrequency {
  word: string
  count: number
  frequency: number
}

export interface ToneFeatures {
  usesExclamations: boolean
  usesFillers: boolean
  formality: number
  liveliness: number
}

export interface LengthStats {
  min: number
  max: number
  average: number
  median: number
  distribution: { range: string; count: number }[]
}

export interface ScenarioPattern {
  scenario: string
  pattern: string
  examples: string[]
}

export class StyleExtractor {
  async extractStyle(records: ChatRecord[]): Promise<StyleProfile> {
    const outgoingRecords = records.filter(r => r.direction === 'outgoing')

    if (outgoingRecords.length === 0) {
      throw new Error('No outgoing messages found for style extraction')
    }

    const frequentWords = this.extractFrequentWords(outgoingRecords)
    const frequentEmojis = this.extractFrequentEmojis(outgoingRecords)
    const toneFeatures = this.analyzeTone(outgoingRecords)
    const replyLengthDistribution = this.analyzeLength(outgoingRecords)
    const sentencePatterns = this.extractSentencePatterns(outgoingRecords)
    const scenarioPatterns = this.extractScenarioPatterns(outgoingRecords)

    return {
      userId: 'current_user',
      frequentWords,
      frequentEmojis,
      toneFeatures,
      replyLengthDistribution,
      sentencePatterns,
      scenarioPatterns,
      lastUpdated: Date.now()
    }
  }

  private extractFrequentWords(records: ChatRecord[]): WordFrequency[] {
    const wordCount: Map<string, number> = new Map()
    const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '与', '或', '但', '而', '就', '都', '也', '还'])

    for (const record of records) {
      const words = this.tokenize(record.content)
      for (const word of words) {
        if (word.length >= 2 && !stopWords.has(word)) {
          wordCount.set(word, (wordCount.get(word) || 0) + 1)
        }
      }
    }

    const totalWords = Array.from(wordCount.values()).reduce((a, b) => a + b, 0)

    return Array.from(wordCount.entries())
      .map(([word, count]) => ({
        word,
        count,
        frequency: count / totalWords
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100)
  }

  private tokenize(text: string): string[] {
    // 简单的中文分词
    const tokens: string[] = []
    let current = ''

    for (const char of text) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push(char)
      } else if (/[a-zA-Z0-9]/.test(char)) {
        current += char
      } else {
        if (current) {
          tokens.push(current)
          current = ''
        }
      }
    }

    if (current) {
      tokens.push(current)
    }

    // 合并成2-4字的词
    const mergedTokens: string[] = []
    for (let i = 0; i < tokens.length; i++) {
      mergedTokens.push(tokens[i])
      if (i + 1 < tokens.length && /[\u4e00-\u9fa5]/.test(tokens[i]) && /[\u4e00-\u9fa5]/.test(tokens[i + 1])) {
        mergedTokens.push(tokens[i] + tokens[i + 1])
      }
      if (i + 2 < tokens.length && /[\u4e00-\u9fa5]/.test(tokens[i]) && /[\u4e00-\u9fa5]/.test(tokens[i + 1]) && /[\u4e00-\u9fa5]/.test(tokens[i + 2])) {
        mergedTokens.push(tokens[i] + tokens[i + 1] + tokens[i + 2])
      }
    }

    return mergedTokens
  }

  private extractFrequentEmojis(records: ChatRecord[]): string[] {
    const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
    const emojiCount: Map<string, number> = new Map()

    for (const record of records) {
      const emojis = record.content.match(emojiPattern) || []
      for (const emoji of emojis) {
        emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + 1)
      }
    }

    return Array.from(emojiCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([emoji]) => emoji)
  }

  private analyzeTone(records: ChatRecord[]): ToneFeatures {
    let exclamationCount = 0
    let fillerCount = 0
    let formalCount = 0
    let casualCount = 0

    const exclamations = ['!', '！', '哈哈', '呵呵', '嘿嘿', '哇', '啊', '呀']
    const fillers = ['嗯', '哦', '额', '呃', 'emmm', 'emm', 'em', 'hmm']
    const formalWords = ['您', '请问', '谢谢', '不好意思', '打扰了']
    const casualWords = ['哈哈', '嘿嘿', '嗯嗯', '好的', '行', 'ok', 'OK']

    for (const record of records) {
      const content = record.content

      for (const ex of exclamations) {
        if (content.includes(ex)) exclamationCount++
      }

      for (const filler of fillers) {
        if (content.includes(filler)) fillerCount++
      }

      for (const word of formalWords) {
        if (content.includes(word)) formalCount++
      }

      for (const word of casualWords) {
        if (content.includes(word)) casualCount++
      }
    }

    const total = records.length

    return {
      usesExclamations: exclamationCount > total * 0.3,
      usesFillers: fillerCount > total * 0.2,
      formality: formalCount / (formalCount + casualCount + 1),
      liveliness: (exclamationCount + fillerCount) / (total * 2)
    }
  }

  private analyzeLength(records: ChatRecord[]): LengthStats {
    const lengths = records.map(r => r.content.length).sort((a, b) => a - b)

    const min = lengths[0]
    const max = lengths[lengths.length - 1]
    const average = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const median = lengths[Math.floor(lengths.length / 2)]

    const ranges = [
      { range: '0-10', min: 0, max: 10 },
      { range: '11-50', min: 11, max: 50 },
      { range: '51-100', min: 51, max: 100 },
      { range: '101-200', min: 101, max: 200 },
      { range: '200+', min: 201, max: Infinity }
    ]

    const distribution = ranges.map(({ range, min: rMin, max: rMax }) => ({
      range,
      count: lengths.filter(l => l >= rMin && l <= rMax).length
    }))

    return { min, max, average, median, distribution }
  }

  private extractSentencePatterns(records: ChatRecord[]): string[] {
    const patterns: Map<string, number> = new Map()

    for (const record of records) {
      const content = record.content

      // 提取开头模式
      const firstChar = content.charAt(0)
      if ('好的嗯哈哈哦额'.includes(firstChar)) {
        const pattern = `${firstChar}...`
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
      }

      // 提取结尾模式
      const lastChar = content.charAt(content.length - 1)
      if ('哈呀啊吧呢嘛'.includes(lastChar)) {
        const pattern = `...${lastChar}`
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
      }
    }

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pattern]) => pattern)
  }

  private extractScenarioPatterns(records: ChatRecord[]): ScenarioPattern[] {
    const patterns: ScenarioPattern[] = []

    // 问候模式
    const greetings = records.filter(r =>
      r.content.includes('你好') || r.content.includes('hi') || r.content.includes('hello')
    )
    if (greetings.length > 0) {
      patterns.push({
        scenario: '问候',
        pattern: 'greeting',
        examples: greetings.slice(0, 3).map(r => r.content)
      })
    }

    // 告别模式
    const goodbyes = records.filter(r =>
      r.content.includes('再见') || r.content.includes('拜拜') || r.content.includes('bye')
    )
    if (goodbyes.length > 0) {
      patterns.push({
        scenario: '告别',
        pattern: 'goodbye',
        examples: goodbyes.slice(0, 3).map(r => r.content)
      })
    }

    // 感谢模式
    const thanks = records.filter(r =>
      r.content.includes('谢谢') || r.content.includes('感谢') || r.content.includes('thanks')
    )
    if (thanks.length > 0) {
      patterns.push({
        scenario: '感谢',
        pattern: 'thanks',
        examples: thanks.slice(0, 3).map(r => r.content)
      })
    }

    return patterns
  }

  generateStylePrompt(profile: StyleProfile): string {
    const parts: string[] = []

    parts.push('用户的说话风格特征：')
    parts.push('')

    if (profile.frequentWords.length > 0) {
      parts.push('常用词汇：')
      const topWords = profile.frequentWords.slice(0, 20).map(w => w.word)
      parts.push(topWords.join('、'))
      parts.push('')
    }

    if (profile.frequentEmojis.length > 0) {
      parts.push('常用表情：')
      parts.push(profile.frequentEmojis.join(' '))
      parts.push('')
    }

    parts.push('语气特征：')
    parts.push(`- 使用感叹词：${profile.toneFeatures.usesExclamations ? '是' : '否'}`)
    parts.push(`- 使用语气词：${profile.toneFeatures.usesFillers ? '是' : '否'}`)
    parts.push(`- 正式度：${(profile.toneFeatures.formality * 100).toFixed(0)}%`)
    parts.push(`- 活泼度：${(profile.toneFeatures.liveliness * 100).toFixed(0)}%`)
    parts.push('')

    parts.push('回复长度特征：')
    parts.push(`- 平均长度：${profile.replyLengthDistribution.average.toFixed(0)}字`)
    parts.push(`- 最短：${profile.replyLengthDistribution.min}字`)
    parts.push(`- 最长：${profile.replyLengthDistribution.max}字`)

    return parts.join('\n')
  }
}
