'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Character, ChatResponse, MessageDTO } from '@/types/chat'

interface ChatContextValue {
  character: Character
  sessionId: string | null
  messages: MessageDTO[]
  isSending: boolean
  sendMessage: (content: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({
  character,
  children,
}: {
  character: Character
  children: ReactNode
}) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDTO[]>([
    {
      id: `first-${character.id}`,
      role: 'assistant',
      type: 'text',
      content: character.firstMessage,
      emotion: 'opening',
      relationshipStage: 'ice_breaking',
      safetyLevel: 'safe',
      createdAt: new Date().toISOString(),
    },
  ])
  const [isSending, setIsSending] = useState(false)
  const inFlightRef = useRef(false)

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || inFlightRef.current) return

      inFlightRef.current = true
      setIsSending(true)
      const optimistic: MessageDTO = {
        id: `local-${Date.now()}`,
        role: 'user',
        type: 'text',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId ?? undefined,
            characterId: character.id,
            message: trimmed,
          }),
        })

        if (!response.ok) throw new Error('chat request failed')
        const data = (await response.json()) as ChatResponse
        setSessionId(data.sessionId)
        setMessages(prev => [
          ...prev.filter(message => message.id !== optimistic.id),
          data.userMessage,
          data.assistantMessage,
        ])
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            type: 'text',
            content: '我刚刚没连上。你再跟我说一遍，好不好？',
            createdAt: new Date().toISOString(),
          },
        ])
      } finally {
        inFlightRef.current = false
        setIsSending(false)
      }
    },
    [character.id, sessionId]
  )

  const value = useMemo(
    () => ({ character, sessionId, messages, isSending, sendMessage }),
    [character, isSending, messages, sendMessage, sessionId]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}
