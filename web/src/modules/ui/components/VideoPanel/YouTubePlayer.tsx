import { useGameStore } from '../../store/gameStore'
import { useYouTubeSync } from '../../hooks/useYouTubeSync'
import { MissionOverlay } from './MissionOverlay'

const PLAYER_CONTAINER_ID = 'yt-player-container'

export function YouTubePlayer() {
  useYouTubeSync(PLAYER_CONTAINER_ID)

  const phase = useGameStore((s) => s.phase)
  const currentVideoId = useGameStore((s) => s.currentVideoId)

  if (phase === 'IDLE' || phase === 'REGION_SELECTED' || phase === 'REGION_CLEARED') {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-500">
        <div className="text-5xl mb-3">🎬</div>
        <p className="text-sm">나라를 선택하면 영상이 재생됩니다</p>
      </div>
    )
  }

  if (phase === 'LOADING') {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-400">
        <div className="text-4xl mb-3 animate-spin">⏳</div>
        <p className="text-sm">영상 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* YouTube IFrame API가 이 div를 대체합니다 */}
      <div
        id={PLAYER_CONTAINER_ID}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      />
      {currentVideoId && <MissionOverlay />}
    </div>
  )
}
