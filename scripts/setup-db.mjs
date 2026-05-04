import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = neon(connectionString)

const statements = [
  `DO $$ BEGIN
    CREATE TYPE character_id AS ENUM ('gentle_sister', 'tsundere_coworker', 'sunshine_girl', 'artsy_cool');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE message_role AS ENUM ('user', 'assistant');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'voice', 'image');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('selfie', 'life', 'meme');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE relationship_stage AS ENUM ('ice_breaking', 'familiar_flirting', 'intimate_company');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE safety_level AS ENUM ('safe', 'boundary', 'crisis');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE generation_status AS ENUM ('pending', 'success', 'failed');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
    CREATE TYPE provider_type AS ENUM ('openrouter', 'doubao_tts', 'seedream');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE TABLE IF NOT EXISTS "user" (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    email_verified boolean NOT NULL DEFAULT false,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS "session" (
    id text PRIMARY KEY,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS account (
    id text PRIMARY KEY,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id text PRIMARY KEY,
    user_id text REFERENCES "user"(id) ON DELETE CASCADE,
    character_id character_id NOT NULL,
    relationship_stage relationship_stage NOT NULL DEFAULT 'ice_breaking',
    message_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    type message_type NOT NULL,
    content text NOT NULL,
    voice_text text,
    audio_url text,
    image_url text,
    image_type image_type,
    image_prompt text,
    emotion text,
    relationship_stage relationship_stage,
    safety_level safety_level,
    raw_llm_response jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS generation_tasks (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_id text,
    provider provider_type NOT NULL,
    status generation_status NOT NULL DEFAULT 'pending',
    request_payload jsonb,
    response_payload jsonb,
    error_code text,
    error_message text,
    duration_ms integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS error_logs (
    id text PRIMARY KEY,
    session_id text REFERENCES chat_sessions(id) ON DELETE SET NULL,
    request_id text,
    provider provider_type,
    code text NOT NULL,
    message text NOT NULL,
    status integer,
    stack text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id text REFERENCES "user"(id) ON DELETE CASCADE;`,
  `CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session"(user_id);`,
  `CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id);`,
  `CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);`,
  `CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS chat_sessions_character_id_idx ON chat_sessions(character_id);`,
  `CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx ON chat_sessions(created_at);`,
  `CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);`,
  `CREATE INDEX IF NOT EXISTS chat_messages_role_idx ON chat_messages(role);`,
  `CREATE INDEX IF NOT EXISTS chat_messages_type_idx ON chat_messages(type);`,
  `CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);`,
  `CREATE INDEX IF NOT EXISTS generation_tasks_session_id_idx ON generation_tasks(session_id);`,
  `CREATE INDEX IF NOT EXISTS generation_tasks_provider_idx ON generation_tasks(provider);`,
  `CREATE INDEX IF NOT EXISTS generation_tasks_status_idx ON generation_tasks(status);`,
  `CREATE INDEX IF NOT EXISTS generation_tasks_created_at_idx ON generation_tasks(created_at);`,
  `CREATE INDEX IF NOT EXISTS error_logs_session_id_idx ON error_logs(session_id);`,
  `CREATE INDEX IF NOT EXISTS error_logs_provider_idx ON error_logs(provider);`,
  `CREATE INDEX IF NOT EXISTS error_logs_code_idx ON error_logs(code);`,
  `CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at);`,
]

for (const statement of statements) {
  await sql.query(statement)
}

const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user', 'session', 'account', 'verification', 'chat_sessions', 'chat_messages', 'generation_tasks', 'error_logs') ORDER BY table_name`
console.log(`Database setup complete: ${rows.map(row => row.table_name).join(', ')}`)
