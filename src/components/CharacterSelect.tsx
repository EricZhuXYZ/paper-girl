import { characters } from '@/data/characters'
import { CharacterCard } from '@/components/CharacterCard'
import { SignOutButton } from '@/components/SignOutButton'

export function CharacterSelect({ user }: { user: { name: string; email: string } }) {
  return (
    <main className="min-h-screen px-5 py-10">
      <section className="mx-auto max-w-[900px]">
        <div className="home-hero mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#bd5b79]">AI 虚拟恋爱聊天 MVP</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#241b20] sm:text-4xl">
              选一个今晚想聊天的人
            </h1>
            <p className="mt-2 text-sm text-[#8b596a]">
              {user.name || user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignOutButton />
          </div>
        </div>
        <div className="character-grid grid gap-5 md:grid-cols-2">
          {characters.map((character, index) => (
            <CharacterCard key={character.id} character={character} index={index} />
          ))}
        </div>
      </section>
    </main>
  )
}
