export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#a8a8a8]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#a8a8a8] [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#a8a8a8] [animation-delay:240ms]" />
    </div>
  )
}
