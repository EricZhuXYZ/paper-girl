'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { useState } from 'react'

export function ImageViewer({
  imageUrl,
  alt,
}: {
  imageUrl?: string | null
  alt: string
}) {
  const [open, setOpen] = useState(false)
  if (!imageUrl) {
    return (
      <div className="max-w-60 rounded-lg bg-white px-4 py-3 text-sm text-[#777]">
        图片生成失败了，我先用文字陪你聊。
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block">
        <Image
          src={imageUrl}
          alt={alt}
          width={240}
          height={288}
          unoptimized
          className="max-h-72 max-w-60 rounded-lg object-cover shadow-sm"
        />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-5"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/12 p-2 text-white"
            aria-label="关闭图片"
          >
            <X className="h-6 w-6" />
          </button>
          <Image
            src={imageUrl}
            alt={alt}
            width={1024}
            height={1024}
            unoptimized
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      ) : null}
    </>
  )
}
