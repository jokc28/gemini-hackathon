import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function MissionResultOverlay() {
  const phase = useGameStore((s) => s.phase)
  const lastResult = useGameStore((s) => s.lastResult)
  const missionQueue = useGameStore((s) => s.missionQueue)
  const startPlaying = useGameStore((s) => s.startPlaying)
  const clearRegion = useGameStore((s) => s.clearRegion)

  useEffect(() => {
    if (phase !== 'MISSION_RESULT') return

    const timer = setTimeout(() => {
      if (missionQueue.length > 0) {
        startPlaying()
      } else {
        clearRegion()
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [phase, missionQueue.length, startPlaying, clearRegion])

  if (phase !== 'MISSION_RESULT' || !lastResult) return null

  const isSuccess = lastResult.success

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg z-40
        ${isSuccess ? 'bg-green-600/85' : 'bg-red-600/85'}`}
    >
      <span className="text-7xl mb-2">{isSuccess ? '✅' : '❌'}</span>
      <p className="text-5xl font-black text-white">
        {isSuccess ? 'SUCCESS!' : 'FAIL'}
      </p>
      {isSuccess && (
        <p className="text-green-200 text-sm mt-2">
          정확도 {Math.round(lastResult.confidence * 100)}%
        </p>
      )}
    </div>
  )
}
