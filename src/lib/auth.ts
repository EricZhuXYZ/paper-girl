import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { captcha } from 'better-auth/plugins'
import { getDb } from '@/db'
import { account, session, user, verification } from '@/db/schema'
import { optionalEnv, requiredEnv } from '@/lib/env'

function getAuthSecret() {
  return process.env.BETTER_AUTH_SECRET ?? requiredEnv('BETTER_AUTH_API_KEY')
}

function getAuthBaseUrl() {
  return (
    optionalEnv('BETTER_AUTH_URL') ??
    optionalEnv('NEXT_PUBLIC_APP_URL') ??
    'http://localhost:3000'
  )
}

const db = getDb()

if (!db) {
  throw new Error('DATABASE_URL is required to initialize Better Auth')
}

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthBaseUrl(),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: requiredEnv('TURNSTILE_SECRET_KEY'),
      endpoints: ['/sign-up/email', '/sign-in/email'],
    }),
  ],
})
