import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

type AppDb = ReturnType<typeof drizzle<typeof schema>>

let cachedDb: AppDb | null = null

export function getDb() {
  if (cachedDb) return cachedDb
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null

  if (connectionString.includes('.neon.tech')) {
    const sql = neon(connectionString)
    const client = Object.assign(
      (query: string, params?: unknown[], options?: Record<string, unknown>) =>
        sql.query(query, params, options),
      { transaction: sql.transaction?.bind(sql) }
    )
    cachedDb = drizzleNeon(client as never, { schema }) as unknown as AppDb
    return cachedDb
  }

  const client = postgres(connectionString, {
    ssl: 'require',
    max: 5,
    connect_timeout: 10,
  })

  cachedDb = drizzle(client, { schema })
  return cachedDb
}
