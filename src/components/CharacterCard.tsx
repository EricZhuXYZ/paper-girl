'use client'

import Link from 'next/link'
import { useState, type MouseEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { MessageCircle, Sparkles } from 'lucide-react'
import type { Character } from '@/types/chat'
import { CharacterAvatar } from '@/components/CharacterAvatar'
import { GlowingEffect } from '@/components/GlowingEffect'

export function CharacterCard({ character, index = 0 }: { character: Character; index?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  function handleMouseMove(event: MouseEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }

  function handleMouseLeave() {
    setIsHovered(false)
  }

  return (
    <motion.div
      className="character-card-shell"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.11,
        duration: 0.56,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/chat/${character.id}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="character-card group relative block overflow-hidden rounded-lg border border-white/50 bg-white/78 p-5 shadow-soft backdrop-blur transition-colors duration-200 hover:bg-white"
      >
        <GlowingEffect glow proximity={120} spread={48} inactiveZone={0} borderWidth={2.4} />
        <motion.div
          className="character-card-shine"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.22 }}
        />
        <motion.div
          className="absolute right-4 top-4 z-10"
          initial={false}
          animate={
            isHovered
              ? { opacity: 1, scale: 1, rotate: shouldReduceMotion ? 0 : 12 }
              : { opacity: 0, scale: shouldReduceMotion ? 1 : 0.65, rotate: 0 }
          }
          transition={{ duration: 0.24 }}
        >
          <Sparkles aria-hidden className="h-4 w-4 text-[#d46180]" />
        </motion.div>
        <div className="relative z-10">
          <div className="flex gap-4">
            <motion.div
              className="character-avatar-glow rounded-full"
              animate={isHovered && !shouldReduceMotion ? { scale: 1.025 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <CharacterAvatar character={character} size="lg" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <motion.h2
                    className="text-xl font-semibold text-[#2d2227]"
                    animate={isHovered && !shouldReduceMotion ? { opacity: 0.92 } : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {character.name}
                  </motion.h2>
                  <p className="mt-1 text-sm text-[#8b596a]">{character.type}</p>
                </div>
                <MessageCircle className="mt-1 h-5 w-5 text-[#d46180] opacity-70 transition group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5c4b52]">{character.tagline}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {character.tags.map((tag, tagIndex) => (
              <motion.span
                key={tag}
                initial={false}
                animate={isHovered && !shouldReduceMotion ? { opacity: 1 } : { opacity: 0.9 }}
                transition={{ delay: tagIndex * 0.025, duration: 0.18 }}
                className="rounded-full bg-[#f8e7ed] px-3 py-1 text-xs font-medium text-[#9b4c65]"
              >
                {tag}
              </motion.span>
            ))}
          </div>
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-[#7c6b72]">
            {character.speakingStyle}
          </p>
          <motion.div
            className="mt-5 inline-flex items-center rounded-md bg-[#2d2227] px-4 py-2 text-sm font-medium text-white transition group-hover:bg-[#d46180]"
            animate={isHovered && !shouldReduceMotion ? { opacity: 1 } : { opacity: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            开始聊天
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}
