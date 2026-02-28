import { useGameStore } from '../../store/gameStore'
import { useYouTubeSync } from '../../hooks/useYouTubeSync'
import { MissionOverlay } from './MissionOverlay'
import { MissionResultOverlay } from '../WebcamPanel/MissionResultOverlay'

export function YouTubePlayer() {
  const currentVideoId = useGameStore((s) => s.currentVideoId)
  const clearedMissions = useGameStore((s) => s.clearedMissions)
  const totalMissions = useGameStore((s) => s.totalMissions)

  // Timer-based mission triggering (always call — React hook rules)
  useYouTubeSync()

  // PLAYING, MISSION_ACTIVE, MISSION_RESULT — show video with overlays
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {currentVideoId ? (
        <>
          {/* YouTube iframe — letterbox-free coverage */}
          <iframe
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&playsinline=1&end=62`}
            allow="autoplay; encrypted-media"
            className="absolute border-0"
            style={{
              top: '50%',
              left: '50%',
              width: 'max(100%, 177.78vh)',
              height: 'max(100%, 56.25vw)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
            title="game-video"
          />

          {/* Invisible click shield */}
          <div className="absolute inset-0 z-10" />

          {/* HUD — mission progress */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-3">
              <span>클리어한 동작: <span className="text-green-400">{clearedMissions}</span></span>
              <span className="text-gray-500">|</span>
              <span>남은 동작: <span className="text-yellow-400">{totalMissions - clearedMissions}</span></span>
            </div>
          </div>

          {/* Mission result overlay (success/fail) — z-40 */}
          <MissionResultOverlay />

          {/* Mission prompt overlay — z-50 */}
          <MissionOverlay />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-red-400">
          videoId missing
        </div>
      )}
    </div>
  )
}
