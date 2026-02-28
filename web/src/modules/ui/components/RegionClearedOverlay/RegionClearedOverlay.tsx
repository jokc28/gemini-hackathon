import { useGameStore } from '../../store/gameStore'

export function RegionClearedOverlay() {
  const phase = useGameStore((s) => s.phase)
  const selectedRegion = useGameStore((s) => s.selectedRegion)
  const score = useGameStore((s) => s.score)
  const resetToIdle = useGameStore((s) => s.resetToIdle)

  if (phase !== 'REGION_CLEARED') return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-green-500/50 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-black text-green-400 mb-2">정복 성공!</h2>
        <p className="text-xl text-white mb-1">
          <span className="text-yellow-400 font-bold">{selectedRegion}</span>
        </p>
        <p className="text-gray-400 text-sm mb-6">
          이 나라가 당신의 영토로 색칠되었습니다
        </p>

        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <p className="text-green-400 text-2xl font-black">
            총 점수: {score} 🌍
          </p>
        </div>

        <button
          onClick={resetToIdle}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-lg"
        >
          다음 나라 정복하기 →
        </button>
      </div>
    </div>
  )
}
