# 纸片人女友聊天 MVP

Next.js App Router + TypeScript + Tailwind + Drizzle ORM implementation for the MVP spec.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Environment

Fill `.env.local` before using real LLM, TTS, image generation, or database persistence.

```bash
DATABASE_URL=
OPENROUTER_API_KEY=
DOUBAO_TTS_API_KEY=
VOLCENGINE_ARK_API_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Database scripts:

```bash
pnpm db:setup
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

`db:setup` uses Neon's HTTPS driver and is the recommended local setup command
when direct TCP access to port 5432 is unavailable.

## Pages

- `/` role selection
- `/chat/[characterId]` WeChat-style chat
- `/admin` character prompt and voice debug page
