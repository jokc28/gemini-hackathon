import { getMissionsForRegion, listCachedRegions } from './index.js'

async function main() {
  console.log('=== 통합 테스트 ===\n')

  // 1. 캐시 목록 확인
  const cached = await listCachedRegions()
  console.log('캐시된 지역:', cached.length > 0 ? cached.join(', ') : '없음')

  // 2. getMissionsForRegion 호출
  const result = await getMissionsForRegion('Tokyo')

  // 3. 검증
  console.assert(result.videoId.length > 0, 'videoId 존재')
  console.assert(result.videoTitle.length > 0, 'videoTitle 존재')
  console.assert(result.regionName === 'Tokyo', 'regionName 일치')
  console.assert(result.missions.length >= 1, '미션 1개 이상')
  console.assert(
    result.missions.every(m =>
      ['jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw'].includes(m.missionType)
    ),
    '모든 missionType이 유효함'
  )
  console.assert(
    result.missions.every(m => m.timeLimit >= 2 && m.timeLimit <= 4),
    'timeLimit 범위 2~4초'
  )

  console.log('\n결과:', JSON.stringify(result, null, 2))
  console.log('\n✓ 모든 검증 통과')
}

main()
