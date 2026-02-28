// src/shared/moduleInterface.ts  ← 이 파일도 수정 금지

import type { MissionResult, MissionType, RegionMissionData } from './types'

// A 모듈이 C에 제공하는 컴포넌트 props 타입
export interface WebcamFeedProps {
  activeMissionType: MissionType | null   // 현재 판정해야 할 미션 타입
  onMissionResult: (result: MissionResult) => void
}

// B 모듈이 C에 제공하는 함수 시그니처
export type GetMissionsForRegion = (regionName: string) => Promise<RegionMissionData>
