// src/shared/types.ts  ← 이 파일은 A/B/C 모두 읽기만, 수정 금지

export type MissionType =
  | 'jump'
  | 'dodge_left'
  | 'dodge_right'
  | 'push'
  | 'catch'
  | 'throw'

export interface MissionTimestamp {
  timestamp: number      // 영상 재생 초
  missionType: MissionType
  prompt: string         // 화면에 표시할 텍스트
  timeLimit: number      // 판정 제한 시간(초), 기본 3
}

export interface MissionResult {
  missionType: MissionType
  success: boolean
  confidence: number
}

export interface RegionMissionData {
  videoId: string
  regionName: string
  missions: MissionTimestamp[]
}
