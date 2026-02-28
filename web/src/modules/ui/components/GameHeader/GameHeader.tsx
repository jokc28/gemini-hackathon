import { useGameStore } from '../../store/gameStore'

export function GameHeader() {
  const score = useGameStore((s) => s.score)
  const clearedRegions = useGameStore((s) => s.clearedRegions)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌍</span>
        <h1 className="text-xl font-bold text-white tracking-wide">WORLD CONQUEST</h1>
      </div>
      <div className="flex items-center gap-6 text-sm text-gray-300">
        <span>
          점수: <span className="text-yellow-400 font-bold text-lg">{score}</span>
        </span>
        <span>
          클리어:{' '}
          <span className="text-green-400 font-bold">{clearedRegions.length}</span>
          <span className="text-gray-500"> / 195</span>
        </span>
      </div>
    </header>
  )
}
