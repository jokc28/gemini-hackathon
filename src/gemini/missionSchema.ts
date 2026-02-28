import { z } from 'zod'

const missionTypeEnum = z.enum([
  'jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw'
])

const missionTimestampSchema = z.object({
  timestamp: z.number().describe('영상 재생 시간 (초)'),
  missionType: missionTypeEnum.describe('미션 타입'),
  prompt: z.string().describe('화면에 표시할 한국어 텍스트 (예: "점프하세요!")'),
  timeLimit: z.number().min(2).max(4).describe('판정 시간 (초)'),
})

export const missionsArraySchema = z.array(missionTimestampSchema)

// Zod v4 내장 toJsonSchema() 사용
export const missionsJsonSchema = missionsArraySchema.toJSONSchema()

export { missionTimestampSchema }
