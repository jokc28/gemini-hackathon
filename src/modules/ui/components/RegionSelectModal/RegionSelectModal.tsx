import { useGameStore } from '../../store/gameStore'

export function RegionSelectModal() {
  const phase = useGameStore((s) => s.phase)
  const selectedRegion = useGameStore((s) => s.selectedRegion)
  const isLoading = useGameStore((s) => s.isLoading)
  const loadingError = useGameStore((s) => s.loadingError)
  const debugLog = useGameStore((s) => s.debugLog)
  const cancelRegion = useGameStore((s) => s.cancelRegion)
  const fetchRegionDataAndStart = useGameStore((s) => s.fetchRegionDataAndStart)

  // Stay visible during both REGION_SELECTED and LOADING phases
  if (phase !== 'REGION_SELECTED' && phase !== 'LOADING') return null

  const handleStart = () => {
    if (!selectedRegion || isLoading) return
    fetchRegionDataAndStart(selectedRegion)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {isLoading ? (
          // Loading overlay
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-12 w-12 text-green-400 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white text-lg font-semibold mb-2">
              {selectedRegion} 데이터 로딩 중...
            </p>
            {debugLog && (
              <p className="text-gray-400 text-sm">{debugLog}</p>
            )}
          </div>
        ) : (
          // Normal region select UI
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏙️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedRegion}
              </h2>
              <p className="text-gray-400 text-sm">
                이 도시를 정복하러 가시겠습니까?
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⚡</span>
                <div>
                  <p className="font-semibold text-white mb-1">도전 방법</p>
                  <p>영상을 보며 나타나는 동작 미션을 수행하세요!</p>
                  <p>모든 미션을 완료하면 이 도시가 당신의 영토가 됩니다.</p>
                </div>
              </div>
            </div>

            {loadingError && (
              <div className="bg-red-900/50 border border-red-600 rounded-xl p-3 mb-4 text-sm text-red-300">
                Error: {loadingError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => cancelRegion()}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
              >
                도전하기! 🚀
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
