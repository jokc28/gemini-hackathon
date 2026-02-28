import type { MissionResult, MissionType, RegionMissionData } from '../motion/types'

// Props type for the WebcamFeed component (Module A → C contract)
export interface WebcamFeedProps {
  activeMissionType: MissionType | null
  onMissionResult: (result: MissionResult) => void
}

// Function signature for mission loading (Module B → C contract)
export type GetMissionsForRegion = (regionName: string) => Promise<RegionMissionData>
