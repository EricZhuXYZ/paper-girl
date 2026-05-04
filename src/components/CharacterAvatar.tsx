import Image from 'next/image'
import type { Character } from '@/types/chat'

export function CharacterAvatar({
  character,
  size = 'md',
}: {
  character: Character
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-24 w-24',
  }[size]
  const pixelSize = {
    sm: 40,
    md: 56,
    lg: 96,
  }[size]

  return (
    <Image
      src={character.avatarUrl}
      alt={character.name}
      width={pixelSize}
      height={pixelSize}
      unoptimized
      className={`${sizeClass} shrink-0 rounded-full border border-white/80 object-cover shadow-sm`}
    />
  )
}
