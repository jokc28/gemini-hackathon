import type { WebcamFeedProps } from '../../../../shared/moduleInterface'
import { MissionResultOverlay } from './MissionResultOverlay'

interface Props {
  WebcamFeedComponent: React.ComponentType<WebcamFeedProps>
  activeMissionType: WebcamFeedProps['activeMissionType']
  onMissionResult: WebcamFeedProps['onMissionResult']
}

export function WebcamPanel({ WebcamFeedComponent, activeMissionType, onMissionResult }: Props) {
  return (
    <div className="relative w-full h-full bg-gray-900">
      <WebcamFeedComponent
        activeMissionType={activeMissionType}
        onMissionResult={onMissionResult}
      />
      <MissionResultOverlay />
    </div>
  )
}
