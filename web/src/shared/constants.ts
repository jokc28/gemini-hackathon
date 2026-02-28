// src/shared/constants.ts  ← 이 파일도 수정 금지

import type { MissionType } from './types'

export const MISSION_TIME_LIMIT_DEFAULT = 3  // 초

export const MISSION_TYPES: MissionType[] = [
  'jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw'
]
