# World Motion Conquest — Full Project Context

## What This Is
A hackathon project (Cerebral Valley × Google Gemini, 2026.02.28). An interactive motion game where users perform physical actions detected via webcam while watching YouTube videos. Cleared missions paint territory on Google Maps.

## Team Roles
- **A (me)**: Webcam + motion detection (MediaPipe)
- **B (merged)**: Gemini Vision + YouTube video analysis → mission timestamp JSON
- **C**: Frontend UI, Google Maps, YouTube iframe, integrates A+B
- **D**: QA + demo prep

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Motion Detection**: @mediapipe/tasks-vision (PoseLandmarker, GPU WASM)
- **Video Analysis**: Gemini 2.5 Flash via @google/genai
- **Video Search**: YouTube Data API v3 via googleapis
- **Schema Validation**: zod
- **Env Config**: dotenv

## Full Project Structure

```
src/
  modules/
    motion/                ← Module A (webcam + detection)
      types.ts             — shared types (A+B compatible)
      usePoseDetection.ts  — low-level hook: webcam + MediaPipe + skeleton drawing
      detectors.ts         — 10 motion detectors, baseline-vs-current, forgiving thresholds
      useMotionGame.ts     — integration hook for C (timestamp sync + callbacks)
      MissionGuide.tsx     — animated stick figure overlay + countdown ring
      MotionDebug.tsx      — standalone debug UI (single + combo mode + debug HUD)
      comboSequences.ts    — 5 preset combo chains
      index.ts             — barrel exports
    missions/              ← Frontend loader for B's data
      index.ts             — getMissionsForRegion(), getAvailableRegions()
  gemini/                  ← Module B (Gemini Vision analysis)
    analyzeVideo.ts        — analyzes YouTube video via Gemini 2.5 Flash → MissionTimestamp[]
    missionSchema.ts       — zod schema for validating Gemini responses
    prompts.ts             — Korean prompt for mission generation
    index.ts               — barrel exports
  youtube/                 ← Module B (YouTube search)
    searchVideos.ts        — searches YouTube Data API v3 for region walking tour videos
    buildQuery.ts          — generates search queries like "{region} walking tour 4K"
    index.ts               — barrel exports
  data/
    pregenerated/          ← Pre-generated mission JSONs (cache-first strategy)
      tokyo.json
      paris.json
      seoul.json
      london.json
      new-york.json
  cache.ts                 — load/save pregenerated missions (Node.js, for scripts)
  config.ts                — env var config (GEMINI_API_KEY, YOUTUBE_API_KEY)
  pregenerate.ts           — CLI script to pre-generate missions for demo regions
  test.ts                  — integration test script
```

## Shared Type Contract

```ts
// Core 6 types — B module generates these via Gemini
type CoreMissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw'

// Extended types — A module extras for combo mode
type ExtendedMissionType = 'duck' | 'wave' | 'clap' | 'punch'

type MissionType = CoreMissionType | ExtendedMissionType

type MissionTimestamp = {
  timestamp: number;      // video playback second
  missionType: MissionType;
  prompt: string;         // Korean display text e.g. "점프하세요!"
  timeLimit: number;      // detection window (seconds), default 3
  direction?: 'left' | 'right';  // B-format compat for dodge
}

type MissionResult = {
  missionType: MissionType;
  success: boolean;
  confidence: number;     // 0-1
}

type RegionMissionData = {
  videoId: string;
  videoTitle?: string;    // added by B module
  regionName: string;
  missions: MissionTimestamp[];
}

type VideoSearchResult = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}
```

## Module A — Detection Details

### Detection approach: baseline-vs-current (single frame)
When a mission starts, the user's current pose is captured as **baseline**. Each subsequent frame is compared against baseline. Success triggers immediately when the threshold is crossed.

### Thresholds (hackathon-forgiving)

| Mission | What it checks | Threshold |
|---|---|---|
| `jump` | Nose Y goes up by 0.04 | Tiny head bob works |
| `dodge_left/right` | Nose X shifts by 0.06 | Slight lean works |
| `push` | Wrist-shoulder distance extends by 0.05 | Small arm extend |
| `catch` | Wrists close (gap < 0.15) + above shoulders | Hands together |
| `throw` | Either wrist moves 0.12 from baseline | Quick arm fling |
| `duck` | Nose Y goes down by 0.05 | Slight crouch |
| `wave` | Wrist above nose + far from shoulder | Raise a hand |
| `clap` | Wrists close (gap < 0.1) + above midline | Hands together |
| `punch` | One wrist moves far, other stays | One-arm extend |

### Debug HUD
Real-time overlay showing: Nose X/Y/Z, Shoulder mid, Wrist distances, active mission + timer.

## Module B — Gemini + YouTube Details

### How B generates missions
1. `searchVideos(regionName)` → YouTube Data API v3 → top 5 embeddable medium-length videos
2. `analyzeVideoForMissions(videoId)` → Gemini 2.5 Flash analyzes video directly from YouTube URL
3. Returns 5-15 `MissionTimestamp[]` with Korean prompts, sorted by timestamp
4. Zod schema validates: mission types constrained to core 6, timeLimit 2-4s

### Pre-generated data (cache-first for demo)
5 cities ready: Tokyo, Paris, Seoul, London, New York. Each has 10-15 missions tied to real YouTube walking tour videos.

### Environment variables required
```
GEMINI_API_KEY=    # from https://aistudio.google.com/apikey
YOUTUBE_API_KEY=   # from Google Cloud Console, YouTube Data API v3 enabled
```

### B module npm scripts
```bash
npm run pregenerate    # pre-generate missions for demo regions
npm run test:b         # integration test
npm run test:youtube   # test YouTube search
npm run test:gemini    # test Gemini analysis
```

## Integration API for Person C

### Loading mission data (from B)
```ts
import { getMissionsForRegion, getAvailableRegions } from './modules/missions';

const regions = getAvailableRegions(); // ['tokyo','paris','seoul','london','new-york']
const data = getMissionsForRegion('tokyo');
// → { videoId, videoTitle, regionName, missions: MissionTimestamp[] }
```

### Running motion detection (from A)
```tsx
import { useMotionGame, MissionGuide } from './modules/motion';

function GameView({ missions }: { missions: MissionTimestamp[] }) {
  const {
    canvasRef,           // attach to <canvas> for webcam + skeleton
    isReady,             // true when MediaPipe + webcam loaded
    activeMission,       // current MissionTimestamp being detected (or null)
    lastResult,          // most recent MissionResult
    timeLeft,            // countdown seconds
    score,               // { success: number, total: number }
    feedVideoTime,       // call with YouTube player.getCurrentTime() each frame
    startMission,        // manual trigger: startMission('jump', 3)
  } = useMotionGame({
    missions,
    onMissionResult: (result, index) => {
      // → { missionType: 'jump', success: true, confidence: 0.9 }
    },
    onAllComplete: (allResults) => {
      // → trigger Google Maps territory coloring
    },
  });

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} />
      {activeMission && (
        <MissionGuide mission={activeMission.missionType} timeLeft={timeLeft} />
      )}
    </div>
  );
}
```

### B-format compatibility
B module may output `{ missionType: "dodge", direction: "left" }`. The `useMotionGame` hook auto-normalizes this to `"dodge_left"`.

## Current Status
- [x] Module A: MediaPipe PoseLandmarker + webcam + skeleton overlay
- [x] Module A: 10 detectors (6 core + 4 extended), hackathon-forgiving thresholds
- [x] Module A: Animated stick figure mission guides + countdown
- [x] Module A: Debug page with HUD, combo mode, full-screen flash
- [x] Module A: Integration hook (useMotionGame) with timestamp sync
- [x] Module B: Gemini 2.5 Flash video analysis → mission JSON
- [x] Module B: YouTube Data API v3 search
- [x] Module B: Pre-generated missions for 5 cities
- [x] Module B: Merged into Module A frontend codebase
- [x] Frontend mission loader for C
- [ ] Module C: Google Maps + YouTube iframe + full game UI
- [ ] Final integration + demo rehearsal
