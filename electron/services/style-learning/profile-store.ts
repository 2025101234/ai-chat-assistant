import { StyleProfile } from './extractor'
import { query, run, get } from '../database/client'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'

export class ProfileStore {
  async saveProfile(userId: string, profile: StyleProfile, contactId?: string): Promise<string> {
    const id = uuidv4()
    const profileData = JSON.stringify(profile)

    const existing = get(
      'SELECT id FROM style_profiles WHERE user_id = ? AND contact_id IS ?',
      [userId, contactId || null]
    )

    if (existing) {
      run(
        'UPDATE style_profiles SET profile_data = ?, version = version + 1, updated_at = datetime(\'now\') WHERE id = ?',
        [profileData, existing.id]
      )
      log.info(`Updated style profile for user ${userId}`)
      return existing.id
    } else {
      run(
        'INSERT INTO style_profiles (id, user_id, contact_id, profile_data) VALUES (?, ?, ?, ?)',
        [id, userId, contactId || null, profileData]
      )
      log.info(`Created new style profile for user ${userId}`)
      return id
    }
  }

  async getProfile(userId: string, contactId?: string): Promise<StyleProfile | null> {
    const row = get(
      'SELECT profile_data FROM style_profiles WHERE user_id = ? AND contact_id IS ?',
      [userId, contactId || null]
    )

    if (!row) {
      return null
    }

    try {
      return JSON.parse(row.profile_data) as StyleProfile
    } catch (error) {
      log.error('Failed to parse style profile:', error)
      return null
    }
  }

  async getAllProfiles(userId: string): Promise<StyleProfile[]> {
    const rows = query(
      'SELECT profile_data FROM style_profiles WHERE user_id = ?',
      [userId]
    )

    return rows.map(row => {
      try {
        return JSON.parse(row.profile_data) as StyleProfile
      } catch {
        return null
      }
    }).filter((p): p is StyleProfile => p !== null)
  }

  async deleteProfile(userId: string, contactId?: string): Promise<boolean> {
    run(
      'DELETE FROM style_profiles WHERE user_id = ? AND contact_id IS ?',
      [userId, contactId || null]
    )

    return true
  }

  async getStylePrompt(userId: string, contactId?: string): Promise<string> {
    const profile = await this.getProfile(userId, contactId)

    if (!profile) {
      return ''
    }

    return this.generateStylePrompt(profile)
  }

  private generateStylePrompt(profile: StyleProfile): string {
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
