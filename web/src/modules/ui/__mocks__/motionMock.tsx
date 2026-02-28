import { useEffect } from 'react'
import type { WebcamFeedProps } from '../../../shared/moduleInterface'

// A 모듈이 없는 동안 사용하는 더미 WebcamFeed
// 2.5초 후 자동으로 success: true 결과 반환

export function WebcamFeedMock({ activeMissionType, onMissionResult }: WebcamFeedProps) {
  useEffect(() => {
    if (!activeMissionType) return

    const timer = setTimeout(() => {
      onMissionResult({
        missionType: activeMissionType,
        success: true,
        confidence: 0.9,
      })
    }, 2500)

    return () => clearTimeout(timer)
  }, [activeMissionType])

  return (
    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white gap-3">
      <div className="text-5xl">📷</div>
      <p className="text-gray-400 text-sm">WebcamFeed (Mock)</p>
      {activeMissionType && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-400 text-sm">
          판정 중: <span className="font-bold">{activeMissionType}</span>
        </div>
      )}
    </div>
  )
}
