import type { GetMissionsForRegion } from '../../../shared/moduleInterface'

// B 모듈이 없는 동안 사용하는 더미 getMissionsForRegion
// 미리 하드코딩된 JSON 반환

// 나라별 미션 데이터 (데모용 YouTube 영상 ID 포함)
const REGION_MISSIONS: Record<string, { videoId: string; prompts: Array<{ timestamp: number; mission: string; prompt: string }> }> = {
  'South Korea': {
    videoId: 'mJt8G2cLMXI', // Seoul walking tour
    prompts: [
      { timestamp: 8,  mission: 'jump',       prompt: '점프하세요! 🦘' },
      { timestamp: 20, mission: 'dodge_left',  prompt: '왼쪽으로 피하세요! ⬅️' },
      { timestamp: 35, mission: 'catch',       prompt: '잡으세요! 🙌' },
    ],
  },
  'Japan': {
    videoId: 'SsKT0s5J8ko', // Tokyo walking tour
    prompts: [
      { timestamp: 10, mission: 'dodge_right', prompt: '오른쪽으로 피하세요! ➡️' },
      { timestamp: 25, mission: 'push',        prompt: '밀어요! 💪' },
      { timestamp: 45, mission: 'jump',        prompt: '장애물을 넘으세요! 🦘' },
    ],
  },
  'France': {
    videoId: 'UOiUc8MCjOs', // Paris walking tour
    prompts: [
      { timestamp: 12, mission: 'catch',       prompt: '잡으세요! 🙌' },
      { timestamp: 30, mission: 'throw',       prompt: '던지세요! 🤾' },
      { timestamp: 50, mission: 'dodge_left',  prompt: '왼쪽으로 피하세요! ⬅️' },
    ],
  },
}

const DEFAULT_MISSIONS = {
  videoId: 'dQw4w9WgXcQ',
  prompts: [
    { timestamp: 10, mission: 'jump',       prompt: '점프하세요! 🦘' },
    { timestamp: 25, mission: 'dodge_left',  prompt: '왼쪽으로 피하세요! ⬅️' },
    { timestamp: 40, mission: 'catch',       prompt: '잡으세요! 🙌' },
  ],
}

export const getMissionsForRegionMock: GetMissionsForRegion = async (regionName) => {
  // 실제 API 호출 흉내 (300ms 딜레이)
  await new Promise((resolve) => setTimeout(resolve, 300))

  const data = REGION_MISSIONS[regionName] ?? DEFAULT_MISSIONS

  return {
    videoId: data.videoId,
    regionName,
    missions: data.prompts.map((p) => ({
      timestamp: p.timestamp,
      missionType: p.mission as any,
      prompt: p.prompt,
      timeLimit: 3,
    })),
  }
}
