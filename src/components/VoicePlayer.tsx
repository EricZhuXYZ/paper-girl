'use client'

import { useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

export function VoicePlayer({
  audioUrl,
  text,
}: {
  audioUrl?: string | null
  text?: string | null
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  async function toggle() {
    if (!audioUrl || !audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }
    await audioRef.current.play()
    setPlaying(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!audioUrl}
      className="flex min-w-36 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left disabled:opacity-70"
      title={text ?? '语音消息'}
    >
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
      ) : null}
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <span className="flex-1 text-sm">{text ? '语音消息' : '语音生成失败'}</span>
      <span className="text-xs text-[#777]">3s</span>
    </button>
  )
}
