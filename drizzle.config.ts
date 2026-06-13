import type { Config } from 'drizzle-kit'

export default {
  schema: './electron/services/database/schema.ts',
  out: './electron/services/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/chat-assistant.db'
  }
} satisfies Config
