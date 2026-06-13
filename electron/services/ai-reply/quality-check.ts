import log from 'electron-log'

export interface QualityCheckResult {
  passed: boolean
  issues: QualityIssue[]
  score: number
}

export interface QualityIssue {
  type: 'sensitive_word' | 'too_long' | 'too_short' | 'inappropriate' | 'format_error'
  message: string
  severity: 'low' | 'medium' | 'high'
}

export class QualityChecker {
  private sensitiveWords: Set<string> = new Set()
  private maxLength: number = 2000
  private minLength: number = 1

  constructor() {
    this.loadSensitiveWords()
  }

  private loadSensitiveWords(): void {
    // 默认敏感词列表
    const defaultWords = [
      '死', '杀', '暴力', '色情', '赌博', '毒品',
      '政治敏感词1', '政治敏感词2'
    ]

    for (const word of defaultWords) {
      this.sensitiveWords.add(word)
    }

    log.info(`Loaded ${this.sensitiveWords.size} sensitive words`)
  }

  addSensitiveWord(word: string): void {
    this.sensitiveWords.add(word)
  }

  removeSensitiveWord(word: string): void {
    this.sensitiveWords.delete(word)
  }

  setMaxLength(length: number): void {
    this.maxLength = length
  }

  setMinLength(length: number): void {
    this.minLength = length
  }

  check(content: string): QualityCheckResult {
    const issues: QualityIssue[] = []
    let score = 100

    // 检查敏感词
    const sensitiveWordIssues = this.checkSensitiveWords(content)
    issues.push(...sensitiveWordIssues)
    score -= sensitiveWordIssues.length * 30

    // 检查长度
    const lengthIssues = this.checkLength(content)
    issues.push(...lengthIssues)
    score -= lengthIssues.length * 10

    // 检查格式
    const formatIssues = this.checkFormat(content)
    issues.push(...formatIssues)
    score -= formatIssues.length * 5

    score = Math.max(0, Math.min(100, score))

    const passed = issues.filter(i => i.severity === 'high').length === 0 && score >= 50

    return {
      passed,
      issues,
      score
    }
  }

  private checkSensitiveWords(content: string): QualityIssue[] {
    const issues: QualityIssue[] = []

    for (const word of this.sensitiveWords) {
      if (content.includes(word)) {
        issues.push({
          type: 'sensitive_word',
          message: `包含敏感词: ${word}`,
          severity: 'high'
        })
      }
    }

    return issues
  }

  private checkLength(content: string): QualityIssue[] {
    const issues: QualityIssue[] = []

    if (content.length > this.maxLength) {
      issues.push({
        type: 'too_long',
        message: `回复过长: ${content.length} > ${this.maxLength}`,
        severity: 'medium'
      })
    }

    if (content.length < this.minLength) {
      issues.push({
        type: 'too_short',
        message: `回复过短: ${content.length} < ${this.minLength}`,
        severity: 'medium'
      })
    }

    return issues
  }

  private checkFormat(content: string): QualityIssue[] {
    const issues: QualityIssue[] = []

    // 检查是否有未闭合的括号
    const openBrackets = (content.match(/\(/g) || []).length
    const closeBrackets = (content.match(/\)/g) || []).length
    if (openBrackets !== closeBrackets) {
      issues.push({
        type: 'format_error',
        message: '括号未正确闭合',
        severity: 'low'
      })
    }

    // 检查是否有连续的标点符号
    if (/[!?！？]{3,}/.test(content)) {
      issues.push({
        type: 'format_error',
        message: '连续标点符号过多',
        severity: 'low'
      })
    }

    return issues
  }
}
