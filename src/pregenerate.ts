import { getMissionsForRegion } from './index.js'
import { listCachedRegions } from './cache.js'

const DEMO_REGIONS = ['Tokyo', 'Paris', 'New York', 'Seoul', 'London']

async function processRegion(region: string): Promise<void> {
  try {
    console.log(`\n=== ${region} 처리 중 ===`)
    const result = await getMissionsForRegion(region)
    console.log(`✓ ${region}: ${result.missions.length}개 미션`)
    console.log(`  영상: "${result.videoTitle}" (${result.videoId})`)
    for (const m of result.missions) {
      console.log(`  [${m.timestamp}초] ${m.missionType} — "${m.prompt}"`)
    }
  } catch (error) {
    console.error(`✗ ${region} 실패:`, error instanceof Error ? error.message : error)
  }
}

async function main() {
  console.log('=== 데모용 미션 사전 생성 ===')
  console.log(`대상 지역: ${DEMO_REGIONS.join(', ')}\n`)

  const cached = await listCachedRegions()
  if (cached.length > 0) {
    console.log(`이미 캐시됨: ${cached.join(', ')}`)
    console.log('(캐시된 지역은 API 호출 없이 즉시 로드됨)\n')
  }

  for (const region of DEMO_REGIONS) {
    await processRegion(region)
  }

  console.log('\n=== 완료 ===')
  const allCached = await listCachedRegions()
  console.log(`캐시된 지역: ${allCached.join(', ')}`)
}

main()
