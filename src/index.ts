import { RegionMissionData } from './types.js'
import { validateConfig } from './config.js'
import { searchVideos } from './youtube/index.js'
import { analyzeVideoForMissions } from './gemini/index.js'
import { loadCachedMissions, saveMissionsToCache, listCachedRegions } from './cache.js'

export {
  type MissionType,
  type MissionTimestamp,
  type MissionResult,
  type RegionMissionData,
  type VideoSearchResult,
} from './types.js'

export { searchVideos } from './youtube/index.js'
export { analyzeVideoForMissions } from './gemini/index.js'
export { listCachedRegions } from './cache.js'

export async function getMissionsForRegion(regionName: string): Promise<RegionMissionData> {
  // 1. 캐시 확인 (사전 생성된 데이터)
  const cached = await loadCachedMissions(regionName)
  if (cached) {
    console.log(`[cache hit] ${regionName}: 사전 생성 데이터 사용 (${cached.missions.length}개 미션)`)
    return cached
  }

  // 2. 실시간 생성
  validateConfig()
  console.log(`[live] ${regionName}: 영상 검색 중...`)

  // 2a. YouTube 검색
  const videos = await searchVideos(regionName)
  if (videos.length === 0) {
    throw new Error(`"${regionName}"에 대한 YouTube 영상을 찾을 수 없습니다`)
  }

  const selectedVideo = videos[0]
  console.log(`[live] 선택 영상: "${selectedVideo.title}" (${selectedVideo.videoId})`)

  // 2b. Gemini 분석
  console.log(`[live] Gemini 미션 분석 중... (30초~2분 소요)`)
  const missions = await analyzeVideoForMissions(selectedVideo.videoId)

  const result: RegionMissionData = {
    videoId: selectedVideo.videoId,
    videoTitle: selectedVideo.title,
    regionName,
    missions,
  }

  // 2c. 캐시 저장
  await saveMissionsToCache(result)
  console.log(`[live] 완료: ${missions.length}개 미션 생성, 캐시 저장됨`)

  return result
}
