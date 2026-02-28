import { useGameStore } from './store/gameStore'
import { GoogleMapContainer } from './components/MapSection/GoogleMapContainer'
import { YouTubePlayer } from './components/VideoPanel/YouTubePlayer'
import { RegionSelectModal } from './components/RegionSelectModal/RegionSelectModal'
import { RegionClearedOverlay } from './components/RegionClearedOverlay/RegionClearedOverlay'
import { WebcamFeed } from '../motion/WebcamFeed'

function DebugOverlay() {
  const phase = useGameStore((s) => s.phase)
  const selectedRegion = useGameStore((s) => s.selectedRegion)
  const currentVideoId = useGameStore((s) => s.currentVideoId)
  const missionQueue = useGameStore((s) => s.missionQueue)
  const debugLog = useGameStore((s) => s.debugLog)

  return (
    <div className="fixed bottom-2 left-2 bg-black/80 text-green-400 text-xs font-mono px-3 py-2 rounded z-[999] pointer-events-none max-w-sm">
      <div>phase: {phase}</div>
      <div>region: {selectedRegion ?? 'null'}</div>
      <div>videoId: {currentVideoId ?? 'null'}</div>
      <div>missions: {missionQueue.length}</div>
      {debugLog && <div className="text-yellow-400 mt-1">{debugLog}</div>}
    </div>
  )
}

export function GameRoot() {
  const phase = useGameStore((s) => s.phase)
  const activeMission = useGameStore((s) => s.activeMission)
  const receiveMissionResult = useGameStore((s) => s.receiveMissionResult)

  const showMap = phase === 'IDLE' || phase === 'REGION_SELECTED' || phase === 'LOADING' || phase === 'REGION_CLEARED'
  const showVideo = phase === 'PLAYING' || phase === 'MISSION_ACTIVE' || phase === 'MISSION_RESULT'

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden">
      {/* Hidden engine — always mounted so MediaPipe stays warm */}
      <WebcamFeed
        activeMissionType={
          phase === 'MISSION_ACTIVE' ? activeMission?.missionType ?? null : null
        }
        onMissionResult={receiveMissionResult}
      />

      {/* Phase-based full-screen views */}
      {showMap && <GoogleMapContainer />}
      {showVideo && <YouTubePlayer />}

      {/* Overlays (self-gating via internal phase checks) */}
      <RegionSelectModal />
      <RegionClearedOverlay />
      <DebugOverlay />
    </div>
  )
}
