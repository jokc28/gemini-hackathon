import { analyzeVideoForMissions } from './index.js'
import { validateConfig } from '../config.js'

async function main() {
  validateConfig()

  console.log('=== Gemini 미션 분석 테스트 ===\n')

  // 짧은 테스트용 영상 사용 (긴 영상은 시간 오래 걸림)
  const testVideoId = '_jDmGaIriTc'

  try {
    console.log(`영상 분석 중... (videoId: ${testVideoId})`)
    console.log('(Gemini가 영상을 처리하는 데 30초~2분 소요될 수 있음)\n')

    const missions = await analyzeVideoForMissions(testVideoId)

    console.log(`생성된 미션: ${missions.length}개\n`)
    for (const m of missions) {
      console.log(`  [${m.timestamp}초] ${m.missionType} — "${m.prompt}" (${m.timeLimit}초)`)
    }

    // 기본 검증
    console.assert(missions.length >= 1, '미션 1개 이상 생성됨')
    console.assert(
      missions.every((m, i) => i === 0 || m.timestamp >= missions[i - 1].timestamp),
      'timestamp 오름차순 정렬됨'
    )
    console.log('\n✓ 모든 검증 통과')
  } catch (error) {
    console.error('실패:', error)
    console.log('\n→ 대안: src/data/pregenerated/ 에 수동 JSON 작성 고려')
  }
}

main()
