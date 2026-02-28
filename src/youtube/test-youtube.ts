import { searchVideos } from './index.js'
import { validateConfig } from '../config.js'

async function main() {
  validateConfig()

  console.log('=== YouTube 검색 테스트 ===\n')

  const regions = ['Tokyo', 'Paris', 'Seoul']
  for (const region of regions) {
    console.log(`[${region}] 검색 중...`)
    try {
      const results = await searchVideos(region)
      console.log(`  결과: ${results.length}개`)
      for (const r of results) {
        console.log(`  - ${r.title} (${r.videoId})`)
      }
    } catch (error) {
      console.error(`  실패:`, error)
    }
    console.log()
  }
}

main()
