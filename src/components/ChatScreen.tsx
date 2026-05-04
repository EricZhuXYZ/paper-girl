'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, SendHorizontal } from 'lucide-react'
import type { Character } from '@/types/chat'
import { ChatProvider, useChat } from '@/context/ChatContext'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { MessageBubble } from '@/components/MessageBubble'
import { TypingIndicator } from '@/components/TypingIndicator'

export function ChatScreen({ character }: { character: Character }) {
  return (
    <ChatProvider character={character}>
      <ChatBody />
    </ChatProvider>
  )
}

function ChatBody() {
  const { character, messages, isSending, sendMessage } = useChat()
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isSending])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text
    setText('')
    await sendMessage(value)
  }

  return (
    <main className="min-h-screen bg-[#EDEDED] sm:bg-transparent sm:px-4 sm:py-6">
      <section className="mx-auto flex h-screen max-w-[600px] flex-col overflow-hidden bg-[#EDEDED] shadow-soft sm:h-[calc(100vh-48px)] sm:rounded-lg">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-black/5 bg-[#f7f7f7] px-4">
          <Link
            href="/"
            aria-label="返回角色选择"
            className="rounded-full p-2 text-[#333] transition hover:bg-black/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <CharacterAvatar character={character} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#222]">{character.name}</div>
            <div className="text-xs text-[#5e8f56]">{isSending ? '正在输入...' : '在线'}</div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="message-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5"
        >
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} character={character} />
          ))}
          {isSending ? (
            <div className="flex gap-2">
              <CharacterAvatar character={character} size="sm" />
              <TypingIndicator />
            </div>
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex shrink-0 items-center gap-2 border-t border-black/5 bg-[#f7f7f7] px-3 py-3"
        >
          <input
            value={text}
            onChange={event => setText(event.target.value)}
            disabled={isSending}
            placeholder="说点什么..."
            className="h-11 min-w-0 flex-1 rounded-md border border-black/10 bg-white px-4 outline-none transition focus:border-[#76b85a]"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            aria-label="发送"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#07C160] text-white transition hover:bg-[#06ad56] disabled:bg-[#b8d9c3]"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </form>
      </section>
    </main>
  )
}
