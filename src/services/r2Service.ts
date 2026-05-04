import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { AppError } from '@/lib/errors'
import { requiredEnv } from '@/lib/env'
import { logInfo } from '@/lib/logger'

let cachedClient: S3Client | null = null

function getR2Client() {
  if (cachedClient) return cachedClient

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: requiredEnv('R2_ENDPOINT'),
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  })

  return cachedClient
}

export async function persistImageToR2(params: {
  sourceUrl: string
  characterId: string
  imageType: string
  sessionId?: string
  requestId?: string
}) {
  logInfo('r2_image_download_started', {
    requestId: params.requestId,
    characterId: params.characterId,
    imageType: params.imageType,
    sessionId: params.sessionId,
  })
  const downloaded = await downloadImage(params.sourceUrl)
  logInfo('r2_image_download_completed', {
    requestId: params.requestId,
    characterId: params.characterId,
    imageType: params.imageType,
    contentType: downloaded.contentType,
    size: downloaded.buffer.byteLength,
  })
  const objectKey = buildImageObjectKey({
    characterId: params.characterId,
    imageType: params.imageType,
    sessionId: params.sessionId,
    extension: downloaded.extension,
  })

  logInfo('r2_image_upload_started', { requestId: params.requestId, objectKey })
  await sendWithTimeout(
    new PutObjectCommand({
      Bucket: requiredEnv('R2_BUCKET_NAME'),
      Key: objectKey,
      Body: downloaded.buffer,
      ContentType: downloaded.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    30_000
  )
  logInfo('r2_image_upload_completed', { requestId: params.requestId, objectKey })

  return {
    objectKey,
    publicUrl: buildPublicUrl(objectKey),
    contentType: downloaded.contentType,
    size: downloaded.buffer.byteLength,
  }
}

async function sendWithTimeout(command: PutObjectCommand, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await getR2Client().send(command, { abortSignal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError({
        code: 'TIMEOUT',
        message: 'R2 upload timed out',
        status: 504,
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function downloadImage(sourceUrl: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: { Accept: 'image/*' },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new AppError({
        code: 'IMAGE_FAILED',
        message: `Generated image download failed with status ${response.status}`,
        status: response.status,
      })
    }

    const contentType = response.headers.get('content-type') ?? 'image/png'
    if (!contentType.startsWith('image/')) {
      throw new AppError({
        code: 'IMAGE_FAILED',
        message: `Generated image download returned ${contentType}`,
        status: 502,
      })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0) {
      throw new AppError({
        code: 'IMAGE_FAILED',
        message: 'Generated image download returned empty body',
        status: 502,
      })
    }

    return {
      buffer,
      contentType,
      extension: extensionFromContentType(contentType),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError({
        code: 'TIMEOUT',
        message: 'Generated image download timed out',
        status: 504,
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function buildImageObjectKey(params: {
  characterId: string
  imageType: string
  sessionId?: string
  extension: string
}) {
  const date = new Date().toISOString().slice(0, 10)
  const safeSession = params.sessionId ?? 'anonymous'
  return [
    'generated',
    params.characterId,
    date,
    `${safeSession}-${params.imageType}-${crypto.randomUUID()}.${params.extension}`,
  ].join('/')
}

function buildPublicUrl(objectKey: string) {
  return `${requiredEnv('R2_PUBLIC_URL').replace(/\/+$/, '')}/${objectKey}`
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return 'png'
}
