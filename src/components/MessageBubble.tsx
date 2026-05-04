import type { Character, MessageDTO } from '@/types/chat'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { VoicePlayer } from '@/components/VoicePlayer'
import { ImageViewer } from '@/components/ImageViewer'

export function MessageBubble({
  message,
  character,
}: {
  message: MessageDTO
  character: Character
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? <CharacterAvatar character={character} size="sm" /> : null}
      <div className={`max-w-[78%] ${isUser ? 'order-1' : ''}`}>
        {message.type === 'voice' ? (
          <VoicePlayer audioUrl={message.audioUrl} text={message.voiceText} />
        ) : message.type === 'image' ? (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm leading-6">
              {message.content}
            </div>
            <ImageViewer imageUrl={message.imageUrl} alt={message.content} />
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-2 text-[15px] leading-7 shadow-sm ${
              isUser
                ? 'rounded-br-sm bg-[#95EC69] text-[#111]'
                : 'rounded-bl-sm bg-white text-[#222]'
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
      {isUser ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8e8d2] text-sm font-semibold text-[#476341]">
          我
        </div>
      ) : null}
    </div>
  )
}
