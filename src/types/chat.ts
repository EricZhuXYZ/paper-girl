export type CharacterId =
  | 'gentle-sister'
  | 'tsundere-coworker'
  | 'sunshine-girl'
  | 'artsy-cool'

export type DbCharacterId =
  | 'gentle_sister'
  | 'tsundere_coworker'
  | 'sunshine_girl'
  | 'artsy_cool'

export const CHARACTER_ID_TO_DB: Record<CharacterId, DbCharacterId> = {
  'gentle-sister': 'gentle_sister',
  'tsundere-coworker': 'tsundere_coworker',
  'sunshine-girl': 'sunshine_girl',
  'artsy-cool': 'artsy_cool',
}

export const DB_TO_CHARACTER_ID: Record<DbCharacterId, CharacterId> = {
  gentle_sister: 'gentle-sister',
  tsundere_coworker: 'tsundere-coworker',
  sunshine_girl: 'sunshine-girl',
  artsy_cool: 'artsy-cool',
}

export type ReplyType = 'text' | 'voice' | 'image'
export type MessageType = 'text' | 'voice' | 'image'
export type ImageType = 'selfie' | 'life' | 'meme'
export type RelationshipStage =
  | 'ice_breaking'
  | 'familiar_flirting'
  | 'intimate_company'
export type SafetyLevel = 'safe' | 'boundary' | 'crisis'

export interface Character {
  id: CharacterId
  name: string
  type: string
  tagline: string
  tags: string[]
  speakingStyle: string
  voiceId: string
  voiceName: string
  voiceDescription: string
  avatarUrl: string
  appearance: string
  firstMessage: string
  examples: string[]
}

export interface LLMReply {
  replyType: ReplyType
  text: string
  voiceText: string | null
  imageType: ImageType | null
  imagePrompt: string | null
  emotion: string
  relationshipStage: RelationshipStage
  safetyLevel: SafetyLevel
}

export interface MessageDTO {
  id: string
  role: 'user' | 'assistant'
  type: MessageType
  content: string
  voiceText?: string | null
  audioUrl?: string | null
  audioDataUrl?: string | null
  duration?: number | null
  imageUrl?: string | null
  imageType?: ImageType | null
  imagePrompt?: string | null
  emotion?: string | null
  relationshipStage?: RelationshipStage | null
  safetyLevel?: SafetyLevel | null
  createdAt: string
}

export interface ChatRequest {
  sessionId?: string
  characterId: CharacterId
  message: string
}

export interface ChatResponse {
  sessionId: string
  userMessage: MessageDTO
  assistantMessage: MessageDTO
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
  type: MessageType
}
