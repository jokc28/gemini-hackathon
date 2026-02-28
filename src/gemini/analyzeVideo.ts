import { GoogleGenAI } from '@google/genai'
import { config } from '../config.js'
import { MissionTimestamp } from '../types.js'
import { MISSION_ANALYSIS_PROMPT } from './prompts.js'
import { missionsArraySchema, missionsJsonSchema } from './missionSchema.js'

export async function analyzeVideoForMissions(videoId: string): Promise<MissionTimestamp[]> {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: youtubeUrl,
              },
            },
            {
              text: MISSION_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: missionsJsonSchema,
      },
    })

    const responseText = response.text ?? ''
    const parsed = missionsArraySchema.parse(JSON.parse(responseText))

    return parsed.sort((a, b) => a.timestamp - b.timestamp)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('INVALID_ARGUMENT') || message.includes('fileUri')) {
      throw new Error(
        `Gemini가 YouTube URL을 처리하지 못했습니다 (videoId: ${videoId}).\n`
        + '가능한 원인:\n'
        + '1. 비공개/연령제한 영상\n'
        + '2. 영상이 너무 김 (무료 티어: 일일 8시간 제한)\n'
        + '3. 지역 제한된 영상\n'
        + '대안: src/data/pregenerated/ 에 수동으로 미션 JSON을 작성하세요.'
      )
    }

    if (message.includes('ZodError') || message.includes('Expected')) {
      console.error('Gemini 응답 파싱 실패:', message)
      throw new Error('Gemini 응답이 예상 스키마와 맞지 않습니다. 프롬프트를 조정해보세요.')
    }

    throw new Error(`Gemini 분석 실패 (videoId: ${videoId}): ${message}`)
  }
}
