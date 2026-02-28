# C 모듈 — 프론트엔드 + 지도 모듈 상세 구현 계획

> PRD 기반 구현 가이드. 담당: 전체 게임 UI, YouTube iframe 재생, Google Maps 땅따먹기 시각화, A/B 모듈 통합
> **핵심 전제:** A/B/C 모듈을 별도 브랜치에서 독립 개발 후 `git merge` 통합. 충돌 방지를 위해 파일 소유권을 명확히 분리한다.

---

## 1. 팀 공통 사전 합의 사항 (브랜치 작업 전 main에 먼저 커밋)

통합 시 충돌을 피하려면 **A/B/C 모두가 참조하는 공유 파일**을 먼저 main 브랜치에 고정한다.
각자 브랜치 작업 중 이 파일을 수정하지 않는다.

### 1.1 공유 타입 파일 (`src/shared/types.ts`)

```ts
// src/shared/types.ts  ← 이 파일은 A/B/C 모두 읽기만, 수정 금지

export type MissionType =
  | 'jump'
  | 'dodge_left'
  | 'dodge_right'
  | 'push'
  | 'catch'
  | 'throw'

export interface MissionTimestamp {
  timestamp: number      // 영상 재생 초
  missionType: MissionType
  prompt: string         // 화면에 표시할 텍스트
  timeLimit: number      // 판정 제한 시간(초), 기본 3
}

export interface MissionResult {
  missionType: MissionType
  success: boolean
  confidence: number
}

export interface RegionMissionData {
  videoId: string
  regionName: string
  missions: MissionTimestamp[]
}
```

### 1.2 공유 상수 파일 (`src/shared/constants.ts`)

```ts
// src/shared/constants.ts  ← 이 파일도 수정 금지

export const MISSION_TIME_LIMIT_DEFAULT = 3  // 초
export const MISSION_TYPES: MissionType[] = [
  'jump', 'dodge_left', 'dodge_right', 'push', 'catch', 'throw'
]
```

### 1.3 모듈 인터페이스 파일 (`src/shared/moduleInterface.ts`)

A/B가 C에 제공해야 하는 인터페이스 시그니처를 미리 정의.
A/B는 이 인터페이스를 구현하고, C는 이 인터페이스를 기반으로 mock을 만든다.

```ts
// src/shared/moduleInterface.ts  ← 이 파일도 수정 금지

import { MissionResult, MissionType, RegionMissionData } from './types'

// A 모듈이 C에 제공하는 컴포넌트 props 타입
export interface WebcamFeedProps {
  activeMissionType: MissionType | null   // 현재 판정해야 할 미션 타입
  onMissionResult: (result: MissionResult) => void
}

// B 모듈이 C에 제공하는 함수 시그니처
export type GetMissionsForRegion = (regionName: string) => Promise<RegionMissionData>
```

---

## 2. 파일 소유권 분리 (충돌 방지 핵심)

각 모듈은 자신의 디렉토리만 수정한다. 다른 모듈 디렉토리는 건드리지 않는다.

```
src/
├── shared/                    ← 🔒 main에서 고정, 아무도 수정 안 함
│   ├── types.ts
│   ├── constants.ts
│   └── moduleInterface.ts
│
├── modules/
│   ├── motion/                ← 🅐 A 모듈 전담 (C는 절대 수정 안 함)
│   │   └── index.ts           ← export { WebcamFeed }
│   │
│   ├── mission/               ← 🅑 B 모듈 전담 (C는 절대 수정 안 함)
│   │   └── index.ts           ← export { getMissionsForRegion }
│   │
│   └── ui/                    ← 🅒 C 모듈 전담 (A/B는 절대 수정 안 함)
│       ├── components/
│       ├── store/
│       ├── hooks/
│       └── __mocks__/         ← C 독립 개발용 A/B mock
│           ├── motionMock.tsx
│           └── missionMock.ts
│
├── App.tsx                    ← ⚠️ 통합 단계(2~3h)에서 팀이 함께 작성
└── main.tsx                   ← ⚠️ 통합 단계에서 팀이 함께 작성
```

> **중요:** `App.tsx`와 `main.tsx`는 독립 개발 단계(0~2h)에서 각자 작성하지 않는다.
> 충돌이 가장 많이 발생하는 진입점 파일이므로 통합 담당자가 통합 단계에 작성한다.

---

## 3. C 모듈 디렉토리 상세 구조 (`src/modules/ui/`)

```
src/modules/ui/
│
├── __mocks__/
│   ├── motionMock.tsx         ← A 모듈 대체 mock (독립 개발 중 사용)
│   └── missionMock.ts         ← B 모듈 대체 mock (독립 개발 중 사용)
│
├── components/
│   ├── GameHeader/
│   │   └── GameHeader.tsx
│   │
│   ├── MapSection/
│   │   ├── GoogleMapContainer.tsx
│   │   ├── ClearedRegionPolygon.tsx
│   │   └── regionData.ts      ← 나라별 폴리곤 좌표 (데모용 5~10개국 하드코딩)
│   │
│   ├── VideoPanel/
│   │   ├── YouTubePlayer.tsx
│   │   └── MissionOverlay.tsx
│   │
│   ├── WebcamPanel/
│   │   ├── WebcamPanel.tsx    ← A 모듈 WebcamFeed를 감싸는 래퍼
│   │   └── MissionResultOverlay.tsx
│   │
│   └── RegionSelectModal/
│       └── RegionSelectModal.tsx
│
├── store/
│   └── gameStore.ts           ← Zustand 전역 상태
│
├── hooks/
│   ├── useYouTubeSync.ts
│   ├── useMissionQueue.ts
│   └── useMapRegions.ts
│
└── GameRoot.tsx               ← C 모듈의 최상위 컴포넌트 (App.tsx에서 import)
```

---

## 4. Mock 전략 — A/B 모듈 없이 독립 개발

### 4.1 A 모듈 Mock (`__mocks__/motionMock.tsx`)

```tsx
// A 모듈이 없는 동안 사용하는 더미 WebcamFeed
// 3초 후 자동으로 success: true 결과 반환

import { WebcamFeedProps } from '../../shared/moduleInterface'

export function WebcamFeedMock({ activeMissionType, onMissionResult }: WebcamFeedProps) {
  useEffect(() => {
    if (!activeMissionType) return
    const timer = setTimeout(() => {
      onMissionResult({ missionType: activeMissionType, success: true, confidence: 0.9 })
    }, 2500)
    return () => clearTimeout(timer)
  }, [activeMissionType])

  return (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
      <p>📷 WebcamFeed (Mock)</p>
      {activeMissionType && <p className="text-yellow-400">판정 중: {activeMissionType}</p>}
    </div>
  )
}
```

### 4.2 B 모듈 Mock (`__mocks__/missionMock.ts`)

```ts
// B 모듈이 없는 동안 사용하는 더미 getMissionsForRegion
// 미리 하드코딩된 JSON 반환

import { GetMissionsForRegion } from '../../shared/moduleInterface'

export const getMissionsForRegionMock: GetMissionsForRegion = async (regionName) => ({
  videoId: 'dQw4w9WgXcQ',  // 테스트용 YouTube ID (교체 예정)
  regionName,
  missions: [
    { timestamp: 10, missionType: 'jump',       prompt: '점프하세요!',   timeLimit: 3 },
    { timestamp: 25, missionType: 'dodge_left',  prompt: '왼쪽으로 피하세요!', timeLimit: 3 },
    { timestamp: 40, missionType: 'catch',       prompt: '잡으세요!',    timeLimit: 3 },
  ],
})
```

### 4.3 통합 단계에서 Mock → 실제 모듈로 교체

통합 단계에서 `GameRoot.tsx` 한 곳만 수정하면 됨:

```tsx
// GameRoot.tsx — 통합 전 (독립 개발 중)
import { WebcamFeedMock as WebcamFeed } from './__mocks__/motionMock'
import { getMissionsForRegionMock as getMissionsForRegion } from './__mocks__/missionMock'

// GameRoot.tsx — 통합 후 (두 줄만 교체)
import { WebcamFeed } from '../motion'               // A 모듈
import { getMissionsForRegion } from '../mission'    // B 모듈
```

---

## 5. 게임 상태 머신

```
IDLE
  ↓ 지도에서 나라 클릭
REGION_SELECTED
  ↓ 팝업 "도전하기!" 클릭
LOADING          ← getMissionsForRegion() 호출 (B 모듈 or Mock)
  ↓ videoId + missions[] 수신
PLAYING          ← YouTube 재생 시작, 타임스탬프 폴링
  ↓ 현재 시간이 mission.timestamp에 도달
MISSION_ACTIVE   ← 오버레이 표시, 카운트다운, A 모듈 판정 대기
  ↓ onMissionResult() 수신 또는 timeLimit 초과
MISSION_RESULT   ← 성공/실패 애니메이션 1.5초
  ↓
  ├─ 미션 남아있음 → PLAYING
  └─ 모든 미션 완료 → REGION_CLEARED
REGION_CLEARED   ← Maps 폴리곤 색칠, 점수 +1
  ↓ 확인 클릭
IDLE
```

---

## 6. 화면 레이아웃

```
┌────────────────────────────────────────────────────────────┐
│  🌍 WORLD CONQUEST     점수: 3     클리어: 3/195            │  ← GameHeader
├────────────────────────────────────────────────────────────┤
│                                                            │
│              Google Maps  (height: 45vh)                   │
│   • 클리어된 나라: 초록 반투명 폴리곤                         │
│   • 클릭 → RegionSelectModal 팝업                           │
│                                                            │
├──────────────────────────┬─────────────────────────────────┤
│  VideoPanel (width: 50%) │  WebcamPanel (width: 50%)       │
│                          │                                 │
│  ┌──────────────────┐    │  ┌─────────────────────────┐    │
│  │  YouTubePlayer   │    │  │  WebcamFeed (A 모듈)     │    │
│  │                  │    │  │  + MediaPipe 스켈레톤     │    │
│  └──────────────────┘    │  └─────────────────────────┘    │
│                          │                                 │
│  [MissionOverlay]        │  [MissionResultOverlay]         │
│  "점프하세요! ⏱ 3"       │  ✅ SUCCESS! / ❌ FAIL          │
│  (MISSION_ACTIVE 시 표시) │  (MISSION_RESULT 시 표시)      │
└──────────────────────────┴─────────────────────────────────┘
```

---

## 7. Zustand 전역 상태 (`store/gameStore.ts`)

```ts
import { create } from 'zustand'
import { MissionTimestamp, MissionResult } from '../../../shared/types'

type GamePhase =
  | 'IDLE' | 'REGION_SELECTED' | 'LOADING'
  | 'PLAYING' | 'MISSION_ACTIVE' | 'MISSION_RESULT' | 'REGION_CLEARED'

interface GameStore {
  phase: GamePhase
  score: number
  clearedRegions: string[]
  selectedRegion: string | null
  currentVideoId: string | null
  missionQueue: MissionTimestamp[]
  firedTimestamps: Set<number>        // 중복 미션 발동 방지
  activeMission: MissionTimestamp | null
  lastResult: MissionResult | null

  // 액션
  selectRegion: (name: string) => void
  cancelRegion: () => void
  startLoading: () => void
  setMissionData: (videoId: string, missions: MissionTimestamp[]) => void
  startPlaying: () => void
  triggerMission: (mission: MissionTimestamp) => void
  receiveMissionResult: (result: MissionResult) => void
  clearRegion: () => void
  resetToIdle: () => void
}
```

---

## 8. 핵심 구현 상세

### 8.1 YouTube 타임스탬프 동기화 (`hooks/useYouTubeSync.ts`)

```ts
useEffect(() => {
  if (phase !== 'PLAYING') return
  const interval = setInterval(() => {
    const currentTime = playerRef.current?.getCurrentTime() ?? 0
    const next = missionQueue.find(
      m => currentTime >= m.timestamp && !firedTimestamps.has(m.timestamp)
    )
    if (next) {
      firedTimestamps.add(next.timestamp)
      playerRef.current?.pauseVideo()    // 미션 중 영상 일시정지
      triggerMission(next)
    }
  }, 100)
  return () => clearInterval(interval)
}, [phase, missionQueue, firedTimestamps])
```

### 8.2 미션 오버레이 (`components/VideoPanel/MissionOverlay.tsx`)

```tsx
// phase === 'MISSION_ACTIVE' 일 때만 렌더
<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
  <h1 className="text-5xl font-bold text-white animate-bounce">
    {activeMission.prompt}
  </h1>
  <CountdownTimer
    seconds={activeMission.timeLimit}
    onExpire={() => receiveMissionResult({
      missionType: activeMission.missionType,
      success: false,
      confidence: 0,
    })}
  />
</div>
```

### 8.3 성공/실패 피드백 (`components/WebcamPanel/MissionResultOverlay.tsx`)

```tsx
// phase === 'MISSION_RESULT' 일 때 1.5초간 표시 후 자동 전환
useEffect(() => {
  if (phase !== 'MISSION_RESULT') return
  const timer = setTimeout(() => {
    missionQueue.length > 0 ? startPlaying() : clearRegion()
  }, 1500)
  return () => clearTimeout(timer)
}, [phase])

const isSuccess = lastResult?.success
<div className={`absolute inset-0 flex items-center justify-center
  ${isSuccess ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
  <span className="text-7xl">{isSuccess ? '✅' : '❌'}</span>
  <p className="text-5xl font-black text-white ml-4">
    {isSuccess ? 'SUCCESS!' : 'FAIL'}
  </p>
</div>
```

### 8.4 Google Maps 폴리곤 색칠 (`components/MapSection/ClearedRegionPolygon.tsx`)

```tsx
// clearedRegions 배열을 map()하여 각 나라마다 <Polygon> 렌더
{clearedRegions.map(region => (
  <Polygon
    key={region}
    paths={REGION_POLYGONS[region]}
    options={{
      fillColor: '#22c55e',
      fillOpacity: 0.45,
      strokeColor: '#16a34a',
      strokeWeight: 2,
    }}
  />
))}
```

**폴리곤 좌표 데이터 (`regionData.ts`) — 데모용 5개국 우선 구현:**

```ts
export const REGION_POLYGONS: Record<string, google.maps.LatLngLiteral[][]> = {
  'Japan':        [[ /* 일본 근사 폴리곤 */ ]],
  'France':       [[ /* 프랑스 근사 폴리곤 */ ]],
  'Brazil':       [[ /* 브라질 근사 폴리곤 */ ]],
  'United States':[[ /* 미국 근사 폴리곤 */ ]],
  'South Korea':  [[ /* 한국 근사 폴리곤 */ ]],
}
```

### 8.5 지역 선택 — Maps 클릭 처리

```tsx
// Google Maps 클릭 이벤트 → Geocoding API로 나라명 추출
const handleMapClick = async (event: google.maps.MapMouseEvent) => {
  if (!event.latLng) return
  const geocoder = new google.maps.Geocoder()
  const { results } = await geocoder.geocode({ location: event.latLng })
  const countryResult = results.find(r => r.types.includes('country'))
  if (countryResult) {
    selectRegion(countryResult.address_components[0].long_name)
  }
}
```

---

## 9. 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | React + Vite + TypeScript |
| 상태 관리 | Zustand |
| 스타일링 | Tailwind CSS |
| Google Maps | `@react-google-maps/api` |
| YouTube | YouTube IFrame API (공식 JS API) |

### 환경 변수 (`.env.local`)

```env
VITE_GOOGLE_MAPS_API_KEY=...
```

---

## 10. 구현 순서 (0~2h 독립 개발)

| 순서 | 작업 | 예상 시간 |
|---|---|---|
| 1 | Vite + React + TS + Tailwind 세팅 | 15분 |
| 2 | `src/shared/` 파일 생성 후 팀에 공유 (main 커밋) | 10분 |
| 3 | Zustand `gameStore.ts` 뼈대 | 20분 |
| 4 | 레이아웃 컴포넌트 구조 (MapSection / VideoPanel / WebcamPanel) | 20분 |
| 5 | Google Maps — 지도 표시 + 클릭 이벤트 + Geocoding | 25분 |
| 6 | YouTube iframe — 영상 재생 + 타임스탬프 폴링 | 25분 |
| 7 | MissionOverlay + CountdownTimer | 15분 |
| 8 | MissionResultOverlay 애니메이션 | 10분 |
| 9 | RegionSelectModal + 폴리곤 색칠 | 10분 |
| **총계** | | **~150분** |

---

## 11. 통합 단계 체크리스트 (2~3h)

```
[ ] 1. feature/ui 브랜치 → main merge
[ ] 2. feature/motion 브랜치 → main merge (충돌: shared/ 파일만 주의)
[ ] 3. feature/mission 브랜치 → main merge (충돌: shared/ 파일만 주의)
[ ] 4. App.tsx + main.tsx 작성 (GameRoot.tsx를 최상위에서 import)
[ ] 5. GameRoot.tsx에서 Mock → 실제 모듈로 import 2줄 교체
[ ] 6. 게임 루프 E2E 테스트
     [ ] 지역 클릭 → 팝업
     [ ] 팝업 확인 → 영상 재생 시작
     [ ] 타임스탬프 도달 → 미션 오버레이 표시
     [ ] 동작 인식 성공 → SUCCESS 애니메이션
     [ ] 모든 미션 클리어 → 폴리곤 색칠
[ ] 7. 사전 처리된 미션 JSON 파일 확인 (B 모듈 deliverable)
```

---

## 12. 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| YouTube autoplay 정책 | `muted=1` 파라미터로 muted autoplay 우회 |
| Maps API 호출 요금 | `localhost` domain restrict 적용, Geocoding은 클릭당 1회만 호출 |
| 타임스탬프 폴링 오차 | 100ms 간격, `timestamp` 이상이면 발동 (elapsed 방식), `firedTimestamps` Set으로 중복 방지 |
| 나라 폴리곤 데이터 | 데모용 5개국만 근사 좌표 하드코딩 |
| A 모듈 미완성 시 데모 | `WebcamFeedMock` 즉시 대체 가능 |
| B 모듈 미완성 시 데모 | `getMissionsForRegionMock` 즉시 대체 가능 |
| merge 충돌 | `src/shared/` 파일은 합의 후 동결, `App.tsx`/`main.tsx`는 통합 단계에서만 작성 |
