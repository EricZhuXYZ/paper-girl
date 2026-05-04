import { Resend } from 'resend'
import { getDb } from '@/db'
import { user as usersTable } from '@/db/schema'
import { generateLoveLetter } from '@/services/llmService'

let resend: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  resend ??= new Resend(process.env.RESEND_API_KEY)
  return resend
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    'https://omniseek.top'
  ).replace(/\/+$/, '')
}

function formatEmailText(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const safeUserName = escapeHtml(userName)

  const { error } = await getResend().emails.send({
    from: '纸片人<papergirl@omniseek.top>',
    to: userEmail,
    subject: '你好呀，我是你的专属朋友 💌',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Hi ${safeUserName}，欢迎来到纸片人女友！</h2>
        <p>从现在起，我就是你的专属女友了。</p>
        <p>有什么心事随时来找我聊，我会一直在这里等你。</p>
        <p>明天早上我会给你发一条早安消息，记得查收哦。</p>
        <br/>
        <p>—— 你的纸片人女友</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Resend welcome email failed: ${error.message}`)
  }
}

export async function sendDailyLoveLetter(userEmail: string, userName: string) {
  const loveLetter = await generateLoveLetter(userName)
  const safeUserName = escapeHtml(userName)
  const safeLoveLetter = formatEmailText(loveLetter)
  const appUrl = getAppUrl()

  const { error } = await getResend().emails.send({
    from: '纸片人女友 <hello@omniseek.top>',
    to: userEmail,
    subject: `早安 ${userName}，今天也想你了`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <p>${safeUserName}，早安。</p>
        <p>${safeLoveLetter}</p>
        <br/>
        <p>—— 你的纸片人女友</p>
        <p style="color: #999; font-size: 12px;">
          想跟我聊天？<a href="${appUrl}">点这里回来找我</a>
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Resend daily love letter failed: ${error.message}`)
  }
}

export async function sendDailyLoveLetterToAll() {
  const db = getDb()
  if (!db) {
    throw new Error('DATABASE_URL is not set')
  }

  const users = await db
    .select({
      email: usersTable.email,
      name: usersTable.name,
    })
    .from(usersTable)

  for (const user of users) {
    try {
      await sendDailyLoveLetter(user.email, user.name)
    } catch (error) {
      console.error(`给 ${user.email} 发情话失败：`, error)
    }
  }
}
