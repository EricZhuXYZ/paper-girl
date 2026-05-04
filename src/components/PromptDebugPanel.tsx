'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { characters } from '@/data/characters'
import { buildSystemPrompt } from '@/lib/prompt'
import type { Character } from '@/types/chat'
import { CharacterAvatar } from '@/components/CharacterAvatar'

export function PromptDebugPanel() {
  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#241b20]">角色人设系统提示词</h1>
            <p className="mt-2 text-sm text-[#7b6670]">开发调试页，不放入普通用户主流程。</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-[#e7cbd4] bg-white/70 px-4 py-2 text-sm text-[#8b596a] transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
        </div>
        <div className="space-y-5">
          {characters.map(character => (
            <CharacterPromptCard key={character.id} character={character} />
          ))}
        </div>
      </section>
    </main>
  )
}

function CharacterPromptCard({ character }: { character: Character }) {
  const [testing, setTesting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const systemPrompt = buildSystemPrompt(character, 'ice_breaking')

  async function testTts() {
    setTesting(true)
    setAudioUrl(null)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          text: character.examples[0],
        }),
      })
      if (!response.ok) throw new Error('tts failed')
      const data = (await response.json()) as { audioUrl?: string }
      setAudioUrl(data.audioUrl ?? null)
    } catch {
      setAudioUrl(null)
    } finally {
      setTesting(false)
    }
  }

  return (
    <article className="rounded-lg border border-white/80 bg-white/82 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <CharacterAvatar character={character} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{character.name}</h2>
              <p className="mt-1 text-sm text-[#8b596a]">
                {character.id} · {character.type}
              </p>
            </div>
            <button
              type="button"
              onClick={testTts}
              disabled={testing}
              className="inline-flex w-fit items-center gap-2 rounded-md bg-[#2d2227] px-4 py-2 text-sm text-white transition hover:bg-[#d46180] disabled:opacity-60"
            >
              <Volume2 className="h-4 w-4" />
              {testing ? '测试中' : 'TTS 测试'}
            </button>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Info label="一句话介绍" value={character.tagline} />
            <Info label="性格标签" value={character.tags.join('、')} />
            <Info label="说话风格" value={character.speakingStyle} />
            <Info label="voiceId" value={character.voiceId} />
            <Info label="voiceName" value={character.voiceName} />
            <Info label="voiceDescription" value={character.voiceDescription} />
            <Info label="头像路径" value={character.avatarUrl} />
            <Info label="外貌描述" value={character.appearance} />
          </div>
          {audioUrl ? (
            <audio className="mt-4 w-full" src={audioUrl} controls />
          ) : null}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">示例输入</h3>
              <pre className="overflow-auto rounded-md bg-[#f5f1f3] p-3 text-xs leading-5">
今天有点累，想找人说说话
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">示例输出</h3>
              <pre className="overflow-auto rounded-md bg-[#f5f1f3] p-3 text-xs leading-5">
{JSON.stringify(
  {
    replyType: 'text',
    text: character.examples[0],
    voiceText: null,
    imageType: null,
    imagePrompt: null,
    emotion: 'caring',
    relationshipStage: 'ice_breaking',
    safetyLevel: 'safe',
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#9b4c65]">
              查看 system prompt
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-[#241b20] p-4 text-xs leading-5 text-white">
              {systemPrompt}
            </pre>
          </details>
        </div>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#fbf7f8] p-3">
      <div className="mb-1 text-xs font-semibold text-[#9b4c65]">{label}</div>
      <div className="break-words text-[#3b3035]">{value}</div>
    </div>
  )
}
