import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { GetMissionsForRegion } from '../../../../shared/moduleInterface'

interface Props {
  getMissionsForRegion: GetMissionsForRegion
}

export function RegionSelectModal({ getMissionsForRegion }: Props) {
  const phase = useGameStore((s) => s.phase)
  const selectedRegion = useGameStore((s) => s.selectedRegion)
  const cancelRegion = useGameStore((s) => s.cancelRegion)
  const startLoading = useGameStore((s) => s.startLoading)
  const setMissionData = useGameStore((s) => s.setMissionData)
  const startPlaying = useGameStore((s) => s.startPlaying)

  // LOADING 상태 진입 시 B 모듈 호출
  useEffect(() => {
    if (phase !== 'LOADING' || !selectedRegion) return

    getMissionsForRegion(selectedRegion)
      .then(({ videoId, missions }) => {
        setMissionData(videoId, missions)
        startPlaying()
      })
      .catch((err) => {
        console.error('getMissionsForRegion error:', err)
        cancelRegion()
      })
  }, [phase, selectedRegion])

  if (phase !== 'REGION_SELECTED') return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌍</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {selectedRegion}
          </h2>
          <p className="text-gray-400 text-sm">
            이 나라를 정복하러 가시겠습니까?
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-sm text-gray-300">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">⚡</span>
            <div>
              <p className="font-semibold text-white mb-1">도전 방법</p>
              <p>영상을 보며 나타나는 동작 미션을 수행하세요!</p>
              <p>모든 미션을 완료하면 이 나라가 당신의 영토가 됩니다.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={cancelRegion}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          >
            취소
          </button>
          <button
            onClick={startLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
          >
            도전하기! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
