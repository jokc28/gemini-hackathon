# 🌍 World Motion Conquest — Hackathon Project Brief

> **Cerebral Valley × Google Gemini Hackathon (2025.02.28)**
> **트랙:** 엔터테인먼트 분야의 Gemini
> **팀 구성:** 4명 (풀타임 3명 + 보조 1명)

---

## 1. 프로젝트 한 줄 요약

웹캠으로 사용자의 전신 동작을 인식하고, YouTube 실제 영상 속 장면에 내가 직접 개입하는 인터랙티브 모션 게임. 미션을 클리어할수록 Google Maps 위에 영토가 색칠되는 **땅따먹기 세계 정복** 게임.

---

## 2. 핵심 게임 루프

```
[Google Maps 지역 선택]
        ↓
[Gemini가 해당 지역 YouTube 영상 큐레이션]
        ↓
[영상 재생 중 Gemini Vision이 장면 분석 → 동작 미션 생성]
        ↓
[MediaPipe 웹캠으로 사용자 동작 인식 → 성공/실패 판정]
        ↓
[클리어 시 Google Maps에 해당 지역 영토 색칠 (땅따먹기)]
```

---

## 3. 동작 미션 예시

| 영상 장면 | 생성되는 미션 | 인식 동작 |
|---|---|---|
| 칼이 날아오는 장면 | "피하세요!" | 옆으로 몸 기울이기 |
| 공이 날아오는 장면 | "잡으세요!" | 두 손 앞으로 뻗기 |
| 문이 막힌 장면 | "밀어요!" | 앞으로 밀기 동작 |
| 오르막 장면 | "달려요!" | 제자리 뛰기 |
| 물건 던지기 장면 | "던지세요!" | 팔 스윙 동작 |

> 미션 타입은 5~6개로 고정하고, Gemini는 "이 장면에 어떤 미션 타입이 자연스러운가"만 분류함 (레이턴시 최적화)

---

## 4. 기술 스택

| 역할 | 기술 |
|---|---|
| 동작 인식 | MediaPipe Pose + Hands (Google) |
| 영상 분석 & 미션 생성 | Gemini Vision API (Gemini 2.5 Flash 권장) |
| 영상 검색 & 재생 | YouTube Data API v3 + YouTube iframe API |
| 지도 & 땅따먹기 | Google Maps JavaScript API + Geometry API |
| 프론트엔드 | Next.js 또는 React (Vite) |
| 백엔드 | FastAPI 또는 Next.js API Routes |

---

## 5. 역할 분담

### 👤 A — 웹캠 + 동작 인식 모듈
**담당:** MediaPipe 세팅, 포즈/손동작 감지, 미션 판정 로직

**구현 목표:**
- 웹캠 스트림에서 실시간 포즈 감지 (MediaPipe Pose)
- 손동작 감지 (MediaPipe Hands)
- 미션 타입별 판정 함수 구현
  - `detectJump()` — 제자리 뛰기
  - `detectDodge(direction)` — 좌/우 피하기
  - `detectPush()` — 앞으로 밀기
  - `detectCatch()` — 양손 앞으로 뻗기
  - `detectThrow()` — 팔 스윙
- 판정 결과를 `{ missionType, success, confidence }` 형태로 이벤트 emit

**인터페이스 (B, C와 연결점):**
```js
// 판정 결과 이벤트
onMissionResult({ missionType: 'jump', success: true, confidence: 0.87 })
```

---

### 👤 B — Gemini + YouTube 연동 모듈
**담당:** YouTube 영상 검색, Gemini Vision 장면 분석, 미션 타임스탬프 생성

**구현 목표:**
- Google Maps에서 선택된 지역명을 받아 YouTube 영상 검색
  - 검색 쿼리 예: `"Tokyo street walking tour"`, `"Fuji mountain hiking"`
- 선택된 영상의 주요 프레임을 Gemini Vision으로 분석
- 각 타임스탬프별 미션 생성 후 JSON으로 저장

```json
[
  { "timestamp": 12, "missionType": "dodge", "direction": "left", "prompt": "칼을 피하세요!" },
  { "timestamp": 34, "missionType": "catch", "prompt": "공을 잡으세요!" },
  { "timestamp": 57, "missionType": "jump", "prompt": "장애물을 넘으세요!" }
]
```

- Gemini 프롬프트 전략:
```
이 영상 프레임을 보고, 시청자가 직접 참여할 수 있는 신체 동작 미션을 생성하세요.
미션 타입은 다음 중 하나여야 합니다: jump, dodge_left, dodge_right, push, catch, throw
응답은 반드시 JSON 형식으로만 반환하세요.
```

**인터페이스 (C와 연결점):**
```js
// 지역명 입력 → 영상 + 미션 리스트 반환
getMissionsForRegion(regionName: string)
  → { videoId: string, missions: MissionTimestamp[] }
```

---

### 👤 C — 프론트엔드 + 지도 모듈
**담당:** 전체 게임 UI, YouTube iframe 재생, Google Maps 땅따먹기 시각화, A/B 모듈 통합

**구현 목표:**
- Google Maps에서 지역 선택 UI
- YouTube iframe으로 영상 재생 + 타임스탬프 동기화
- 미션 오버레이 UI (영상 위에 "점프하세요!" 텍스트 + 카운트다운)
- A 모듈 판정 결과 수신 → 성공/실패 피드백 애니메이션
- 클리어된 지역을 Google Maps에 폴리곤으로 색칠 (땅따먹기)
- 전체 게임 상태 관리

**화면 레이아웃:**
```
┌─────────────────────────────────────┐
│         Google Maps (땅따먹기)        │
│  [클리어된 나라 색칠됨]               │
├──────────────┬──────────────────────┤
│  YouTube 영상 │   웹캠 피드           │
│  + 미션 오버레이│  (MediaPipe 오버레이) │
└──────────────┴──────────────────────┘
```

---

### 👤 D — QA + 데모 준비 (보조)
- 각 모듈 버그 리포트
- 데모 시나리오 리허설 (3분 피치)
- 1분 데모 영상 촬영 및 YouTube/Loom 업로드
- 제출 폼 작성: https://cerebralvalley.ai/e/gemini-3-seoul-hackathon/hackathon/submit

---

## 6. 개발 전략: 사전 처리 방식 (권장)

> ⚠️ 실시간 Gemini 분석은 레이턴시 리스크가 있음. **데모 안정성을 위해 사전 처리 방식 채택.**

1. 시연에 사용할 YouTube 영상 **3~5개를 미리 선정**
2. 해당 영상들을 Gemini로 사전 분석 → 미션 타임스탬프 JSON 생성
3. 데모 시 JSON을 불러와서 재생 — 심사위원은 실시간인지 모름
4. 이후 확장 시 실시간으로 전환 가능

---

## 7. 개발 타임라인

| 시간 | A | B | C | D |
|---|---|---|---|---|
| 0~2h | MediaPipe 독립 데모 | Gemini 미션 JSON 생성 | Maps + iframe UI | 환경 세팅 지원 |
| 2~3h | **통합** — A+B+C 연결 | | | 버그 리포트 |
| 3h~제출 | 데모 리허설 + 버그픽스 | | | 영상 촬영 + 제출 |

---

## 8. 모듈 간 인터페이스 정의 (통합 기준)

> 각자 독립 개발 후 통합할 때 이 인터페이스만 맞추면 됨

```ts
// 공유 타입 정의
type MissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw'

type MissionTimestamp = {
  timestamp: number      // 영상 재생 초
  missionType: MissionType
  prompt: string         // 화면에 표시할 텍스트
  timeLimit: number      // 판정 시간 (초), 기본 3초
}

type MissionResult = {
  missionType: MissionType
  success: boolean
  confidence: number
}

type RegionMissionData = {
  videoId: string
  regionName: string
  missions: MissionTimestamp[]
}
```

---

## 9. 피치 스크립트 (3분)

> "Zwift는 수백만 원짜리 스마트 트레이너가 필요합니다. 우리는 웹캠 하나로 전 세계를 정복합니다."
>
> YouTube 실제 영상 속 장면에 내 몸으로 직접 반응하고, 클리어할수록 Google Maps 위에 내 영토가 생깁니다. Google Gemini, MediaPipe, YouTube, Google Maps — 구글 생태계 전체를 하나의 게임으로 연결했습니다.

---

## 10. 심사 기준 대응

| 기준 | 배점 | 우리 프로젝트의 대응 |
|---|---|---|
| 데모 | 50% | 웹캠 앞에서 실시간 동작 인식 → 즉각적인 시각 피드백 |
| 임팩트 | 25% | 피트니스 + 게임 + 세계 여행을 웹캠 하나로 |
| 창의성 | 15% | YouTube 실영상 + 동작 인식 + 땅따먹기의 결합 |
| 피치 | 10% | Zwift 대비 접근성 차별화 스토리 |

---

## 11. 제출 정보

- **제출 링크:** https://cerebralvalley.ai/e/gemini-3-seoul-hackathon/hackathon/submit
- **필요 항목:** 1분 데모 영상 (YouTube 또는 Loom)
- **심사일:** 2025년 2월 28일 (오늘)

---

## 12. 금지 사항 체크리스트

- [ ] 기존 프로젝트 제출 금지 → 오늘 만든 코드만
- [ ] 기여 내용 명확히 구분 → 오픈소스 사용 시 명시
- [ ] 의료 조언, 단순 RAG, 단순 챗봇 아님 ✅
- [ ] 팀 최대 4명 준수 ✅

---

*이 문서는 팀 전체가 같은 맥락을 공유하기 위한 단일 소스입니다. 개발 중 변경사항은 이 문서에 반영하세요.*
