import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const characterIdEnum = pgEnum('character_id', [
  'gentle_sister',
  'tsundere_coworker',
  'sunshine_girl',
  'artsy_cool',
])

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant'])
export const messageTypeEnum = pgEnum('message_type', ['text', 'voice', 'image'])
export const imageTypeEnum = pgEnum('image_type', ['selfie', 'life', 'meme'])
export const relationshipStageEnum = pgEnum('relationship_stage', [
  'ice_breaking',
  'familiar_flirting',
  'intimate_company',
])
export const safetyLevelEnum = pgEnum('safety_level', ['safe', 'boundary', 'crisis'])
export const generationStatusEnum = pgEnum('generation_status', [
  'pending',
  'success',
  'failed',
])
export const providerTypeEnum = pgEnum('provider_type', [
  'openrouter',
  'doubao_tts',
  'seedream',
])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  table => ({
    userIdIdx: index('session_user_id_idx').on(table.userId),
  })
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => ({
    userIdIdx: index('account_user_id_idx').on(table.userId),
  })
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => ({
    identifierIdx: index('verification_identifier_idx').on(table.identifier),
  })
)

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    characterId: characterIdEnum('character_id').notNull(),
    relationshipStage: relationshipStageEnum('relationship_stage')
      .notNull()
      .default('ice_breaking'),
    messageCount: integer('message_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    userIdIdx: index('chat_sessions_user_id_idx').on(table.userId),
    characterIdIdx: index('chat_sessions_character_id_idx').on(table.characterId),
    createdAtIdx: index('chat_sessions_created_at_idx').on(table.createdAt),
  })
)

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    type: messageTypeEnum('type').notNull(),
    content: text('content').notNull(),
    voiceText: text('voice_text'),
    audioUrl: text('audio_url'),
    imageUrl: text('image_url'),
    imageType: imageTypeEnum('image_type'),
    imagePrompt: text('image_prompt'),
    emotion: text('emotion'),
    relationshipStage: relationshipStageEnum('relationship_stage'),
    safetyLevel: safetyLevelEnum('safety_level'),
    rawLlmResponse: jsonb('raw_llm_response'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    sessionIdIdx: index('chat_messages_session_id_idx').on(table.sessionId),
    roleIdx: index('chat_messages_role_idx').on(table.role),
    typeIdx: index('chat_messages_type_idx').on(table.type),
    createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
  })
)

export const generationTasks = pgTable(
  'generation_tasks',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    messageId: text('message_id'),
    provider: providerTypeEnum('provider').notNull(),
    status: generationStatusEnum('status').notNull().default('pending'),
    requestPayload: jsonb('request_payload'),
    responsePayload: jsonb('response_payload'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    sessionIdIdx: index('generation_tasks_session_id_idx').on(table.sessionId),
    providerIdx: index('generation_tasks_provider_idx').on(table.provider),
    statusIdx: index('generation_tasks_status_idx').on(table.status),
    createdAtIdx: index('generation_tasks_created_at_idx').on(table.createdAt),
  })
)

export const errorLogs = pgTable(
  'error_logs',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => chatSessions.id, {
      onDelete: 'set null',
    }),
    requestId: text('request_id'),
    provider: providerTypeEnum('provider'),
    code: text('code').notNull(),
    message: text('message').notNull(),
    status: integer('status'),
    stack: text('stack'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    sessionIdIdx: index('error_logs_session_id_idx').on(table.sessionId),
    providerIdx: index('error_logs_provider_idx').on(table.provider),
    codeIdx: index('error_logs_code_idx').on(table.code),
    createdAtIdx: index('error_logs_created_at_idx').on(table.createdAt),
  })
)

export const chatSessionsRelations = relations(chatSessions, ({ many, one }) => ({
  user: one(user, {
    fields: [chatSessions.userId],
    references: [user.id],
  }),
  messages: many(chatMessages),
  generations: many(generationTasks),
  errorLogs: many(errorLogs),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  chatSessions: many(chatSessions),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}))

export const generationTasksRelations = relations(generationTasks, ({ one }) => ({
  session: one(chatSessions, {
    fields: [generationTasks.sessionId],
    references: [chatSessions.id],
  }),
}))

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  session: one(chatSessions, {
    fields: [errorLogs.sessionId],
    references: [chatSessions.id],
  }),
}))
