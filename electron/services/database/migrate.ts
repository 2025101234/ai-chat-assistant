import { getDatabase, closeDatabase } from './client'
import log from 'electron-log'

export async function runMigrations(): Promise<void> {
  log.info('Running database migrations...')
  
  try {
    await getDatabase()
    log.info('Database migrations completed successfully')
  } catch (error) {
    log.error('Migration failed:', error)
    throw error
  } finally {
    closeDatabase()
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migrations failed:', error)
      process.exit(1)
    })
}
