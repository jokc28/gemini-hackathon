import dotenv from 'dotenv'
dotenv.config()

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? '',
} as const

export function validateConfig(): void {
  if (!config.geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY가 설정되지 않았습니다.\n'
      + '1. https://aistudio.google.com/apikey 에서 키 발급\n'
      + '2. .env 파일에 GEMINI_API_KEY=xxx 추가'
    )
  }
  if (!config.youtubeApiKey) {
    throw new Error(
      'YOUTUBE_API_KEY가 설정되지 않았습니다.\n'
      + '1. https://console.cloud.google.com/apis/credentials 에서 키 발급\n'
      + '2. YouTube Data API v3 활성화 필요\n'
      + '3. .env 파일에 YOUTUBE_API_KEY=xxx 추가'
    )
  }
}
