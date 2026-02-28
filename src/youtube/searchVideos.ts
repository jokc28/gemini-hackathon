import { google } from 'googleapis'
import { config } from '../config.js'
import { VideoSearchResult } from '../types.js'
import { buildSearchQuery } from './buildQuery.js'

export async function searchVideos(regionName: string): Promise<VideoSearchResult[]> {
  const youtube = google.youtube({ version: 'v3', auth: config.youtubeApiKey })
  const query = buildSearchQuery(regionName)

  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 5,
      videoDuration: 'medium',
      videoEmbeddable: 'true',
      order: 'relevance',
    })

    const items = response.data.items ?? []

    return items
      .map(item => ({
        videoId: item.id?.videoId ?? '',
        title: item.snippet?.title ?? '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? '',
      }))
      .filter(item => item.videoId !== '')

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('403') || message.includes('forbidden')) {
      throw new Error(
        'YouTube API 접근 거부. 확인사항:\n'
        + '1. YOUTUBE_API_KEY가 올바른지 확인\n'
        + '2. Google Cloud Console에서 YouTube Data API v3이 활성화되어 있는지 확인\n'
        + '3. API 키 제한(referrer 등)이 걸려있지 않은지 확인'
      )
    }

    if (message.includes('quota')) {
      throw new Error(
        'YouTube API 할당량 초과. YouTube Data API v3 일일 할당량: 10,000 유닛.\n'
        + 'search.list 1회 = 100 유닛. 하루 최대 100회 검색 가능.'
      )
    }

    throw new Error(`YouTube 검색 실패 (query: "${query}"): ${message}`)
  }
}
