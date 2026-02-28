// ============================================================
// GameRoot.tsx — C 모듈 최상위 컴포넌트
//
// 통합 전 (독립 개발 중): Mock import 사용
// 통합 후: 아래 두 줄을 실제 모듈 import로 교체
//
//   import { WebcamFeed } from '../motion'            // A 모듈
//   import { getMissionsForRegion } from '../mission' // B 모듈
// ============================================================

import { useGameStore } from './store/gameStore'
import { GameHeader } from './components/GameHeader/GameHeader'
import { GoogleMapContainer } from './components/MapSection/GoogleMapContainer'
import { YouTubePlayer } from './components/VideoPanel/YouTubePlayer'
import { WebcamPanel } from './components/WebcamPanel/WebcamPanel'
import { RegionSelectModal } from './components/RegionSelectModal/RegionSelectModal'
import { RegionClearedOverlay } from './components/RegionClearedOverlay/RegionClearedOverlay'

// ↓↓↓ 통합 시 이 두 줄을 실제 모듈 import로 교체 ↓↓↓
import { WebcamFeedMock as WebcamFeed } from './__mocks__/motionMock'
import { getMissionsForRegionMock as getMissionsForRegion } from './__mocks__/missionMock'
// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

export function GameRoot() {
  const phase = useGameStore((s) => s.phase)
  const activeMission = useGameStore((s) => s.activeMission)
  const receiveMissionResult = useGameStore((s) => s.receiveMissionResult)

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      {/* 헤더 */}
      <GameHeader />

      {/* 지도 영역 */}
      <GoogleMapContainer />

      {/* 하단 패널: 영상 + 웹캠 */}
      <div className="flex flex-1 min-h-0">
        {/* 영상 패널 (50%) */}
        <div className="flex-1 relative border-r border-gray-700">
          <YouTubePlayer />
        </div>

        {/* 웹캠 패널 (50%) */}
        <div className="flex-1 relative">
          <WebcamPanel
            WebcamFeedComponent={WebcamFeed}
            activeMissionType={
              phase === 'MISSION_ACTIVE' ? activeMission?.missionType ?? null : null
            }
            onMissionResult={receiveMissionResult}
          />
        </div>
      </div>

      {/* 오버레이 모달들 */}
      <RegionSelectModal getMissionsForRegion={getMissionsForRegion} />
      <RegionClearedOverlay />
    </div>
  )
}
