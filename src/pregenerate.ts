import { searchVideos } from './youtube/searchVideos.js'
import { analyzeVideoForMissions } from './gemini/analyzeVideo.js'
import { loadCachedMissions, saveMissionsToCache, listCachedRegions } from './cache.js'
import { validateConfig } from './config.js'

const KOREAN_CITIES = ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Jeju']

// Delay between cities to avoid Gemini rate limits (free tier: 250k tokens/min)
const INTER_CITY_DELAY_MS = 15000

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processCity(city: string): Promise<void> {
  // Check if already cached
  const cached = await loadCachedMissions(city)
  if (cached) {
    console.log(`✓ ${city}: already cached (${cached.missions.length} missions, video=${cached.videoId})`)
    return
  }

  console.log(`\n=== ${city} 처리 중 ===`)

  // Search YouTube for a POV walking tour
  console.log(`  Searching YouTube for "${city} walking tour"...`)
  const videos = await searchVideos(city)
  if (videos.length === 0) {
    console.error(`  ✗ No videos found for ${city}`)
    return
  }

  const video = videos[0]
  console.log(`  Found: "${video.title}" (${video.videoId})`)

  // Generate missions with Gemini (retry on rate limit)
  let missions
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`  Analyzing video with Gemini...${attempt > 0 ? ` (retry ${attempt})` : ''}`)
      missions = await analyzeVideoForMissions(video.videoId)
      break
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        console.log(`  ⏳ Rate limited, waiting 35 seconds...`)
        await sleep(35000)
      } else {
        throw err
      }
    }
  }

  if (!missions) {
    console.error(`  ✗ Failed to generate missions for ${city} after retries`)
    return
  }

  console.log(`  Generated ${missions.length} missions`)

  // Save to cache
  await saveMissionsToCache({
    videoId: video.videoId,
    videoTitle: video.title,
    regionName: city,
    missions,
  })
  console.log(`  ✓ Saved to cache`)

  for (const m of missions) {
    console.log(`  [${m.timestamp}s] ${m.missionType} — "${m.prompt}"`)
  }
}

async function main() {
  validateConfig()

  console.log('=== 한국 도시 미션 사전 생성 ===')
  console.log(`대상 도시: ${KOREAN_CITIES.join(', ')}\n`)

  const cached = await listCachedRegions()
  if (cached.length > 0) {
    console.log(`이미 캐시됨: ${cached.join(', ')}\n`)
  }

  for (let i = 0; i < KOREAN_CITIES.length; i++) {
    const city = KOREAN_CITIES[i]
    // Add delay between uncached cities to avoid rate limits
    if (i > 0) {
      const prevCached = await loadCachedMissions(city)
      if (!prevCached) {
        console.log(`  ⏳ Waiting ${INTER_CITY_DELAY_MS / 1000}s before next city...`)
        await sleep(INTER_CITY_DELAY_MS)
      }
    }
    await processCity(city)
  }

  console.log('\n=== 완료 ===')
  const allCached = await listCachedRegions()
  console.log(`캐시된 지역: ${allCached.join(', ')}`)
}

main()
