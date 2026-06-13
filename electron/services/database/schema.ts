import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const chatRecords = sqliteTable('chat_records', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  contactId: text('contact_id').notNull(),
  contactName: text('contact_name'),
  direction: text('direction').notNull(),
  content: text('content').notNull(),
  messageType: text('message_type').default('text'),
  senderId: text('sender_id'),
  senderName: text('sender_name'),
  isAiReply: integer('is_ai_reply').default(0),
  timestamp: integer('timestamp').notNull(),
  createdAt: text('created_at').default(sql`datetime('now')`)
})

export const aiReplyLogs = sqliteTable('ai_reply_logs', {
  id: text('id').primaryKey(),
  chatRecordId: text('chat_record_id').references(() => chatRecords.id),
  modelUsed: text('model_used').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  latencyMs: integer('latency_ms'),
  confidence: real('confidence'),
  status: text('status').notNull(),
  originalReply: text('original_reply'),
  finalReply: text('final_reply'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').default(sql`datetime('now')`)
})

export const styleProfiles = sqliteTable('style_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  contactId: text('contact_id'),
  profileData: text('profile_data').notNull(),
  version: integer('version').default(1),
  updatedAt: text('updated_at').default(sql`datetime('now')`)
})

export const modelConfigs = sqliteTable('model_configs', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  name: text('name').notNull(),
  apiKeyEnc: text('api_key_enc').notNull(),
  endpoint: text('endpoint'),
  defaultModel: text('default_model').notNull(),
  isActive: integer('is_active').default(1),
  extraConfig: text('extra_config'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`)
})

export const contactPolicies = sqliteTable('contact_policies', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  contactId: text('contact_id').notNull(),
  autoReply: integer('auto_reply').default(1),
  replyMode: text('reply_mode').default('auto'),
  modelOverride: text('model_override'),
  delayMinMs: integer('delay_min_ms').default(1000),
  delayMaxMs: integer('delay_max_ms').default(5000),
  priority: text('priority').default('normal'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`)
})

export const systemConfigs = sqliteTable('system_configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`datetime('now')`)
})

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  detail: text('detail'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').default(sql`datetime('now')`)
})
