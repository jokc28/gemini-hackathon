export type MissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw'

export type MissionTimestamp = {
  timestamp: number       // 영상 재생 초
  missionType: MissionType
  prompt: string          // 화면에 표시할 텍스트 (예: "점프하세요!")
  timeLimit: number       // 판정 시간 (초), 기본 3
}

export type MissionResult = {
  missionType: MissionType
  success: boolean
  confidence: number
}

export type RegionMissionData = {
  videoId: string
  videoTitle: string
  regionName: string
  missions: MissionTimestamp[]
}

export type VideoSearchResult = {
  videoId: string
  title: string
  thumbnailUrl: string
}
