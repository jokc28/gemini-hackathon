# Module A — Webcam + Motion Recognition

## What This Is
Part of **World Motion Conquest**, a hackathon project (Cerebral Valley × Google Gemini, 2026.02.28). An interactive motion game where users perform physical actions detected via webcam while watching YouTube videos. Cleared missions paint territory on Google Maps.

## My Role (Person A)
Webcam + motion detection module using MediaPipe. Other teammates handle:
- **B**: Gemini Vision + YouTube video analysis → mission timestamp JSON
- **C**: Frontend UI, Google Maps, YouTube iframe, integrates A+B

## Tech Stack
- **React + Vite + TypeScript**
- **@mediapipe/tasks-vision** — PoseLandmarker (33-point skeleton, GPU-accelerated WASM)
- No backend needed for this module — runs entirely in-browser

## Architecture

```
src/modules/motion/
  types.ts              — shared types (CoreMissionType, ExtendedMissionType, MissionResult, etc.)
  usePoseDetection.ts   — low-level hook: webcam + MediaPipe PoseLandmarker + skeleton drawing
  detectors.ts          — 10 motion detectors using landmark frame-diffing
  useMotionGame.ts      — HIGH-LEVEL integration hook for Person C (timestamp sync + callbacks)
  MissionGuide.tsx      — animated stick figure overlay + countdown ring
  MotionDebug.tsx       — standalone demo UI (single missions + combo mode)
  comboSequences.ts     — preset combo chains (Street Fighter, Ninja Reflexes, etc.)
  index.ts              — barrel exports
src/data/
  sample-missions.json  — mock B-module output for testing integration
```

## Shared Type Contract (matches team spec)

```ts
// Core 6 types — B module generates these via Gemini
type CoreMissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw'

// Extended types — A module extras for combo mode
type ExtendedMissionType = 'duck' | 'wave' | 'clap' | 'punch'

type MissionType = CoreMissionType | ExtendedMissionType

type MissionTimestamp = {
  timestamp: number;      // video playback second
  missionType: MissionType;
  prompt: string;         // display text
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
  regionName: string;
  missions: MissionTimestamp[];
}
```

## Integration API for Person C

### Primary hook: `useMotionGame`

```tsx
import { useMotionGame, MissionGuide } from './modules/motion';

function GameView({ missions }: { missions: MissionTimestamp[] }) {
  const {
    canvasRef,           // attach to <canvas> for webcam + skeleton
    isReady,             // true when MediaPipe + webcam loaded
    activeMission,       // current mission being detected (or null)
    lastResult,          // most recent MissionResult
    timeLeft,            // countdown seconds for current mission
    score,               // { success: number, total: number }
    feedVideoTime,       // call with YouTube currentTime each frame
    startMission,        // manual trigger: startMission('jump', 3)
  } = useMotionGame({
    missions,
    onMissionResult: (result, index) => {
      console.log(`Mission ${index}:`, result);
      // → { missionType: 'jump', success: true, confidence: 0.87 }
    },
    onAllComplete: (allResults) => {
      console.log('Region complete!', allResults);
      // → trigger map territory coloring
    },
  });

  // In YouTube player timeupdate loop:
  // feedVideoTime(player.getCurrentTime());

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
B module may output `{ missionType: "dodge", direction: "left" }`. The hook auto-normalizes this to `"dodge_left"`. No conversion needed on C's side.

## Detection Logic (10 motions)

| Mission | Detection Method | Key Landmarks |
|---|---|---|
| `jump` | Hip Y rises then falls | Hips |
| `dodge_left/right` | Shoulder midpoint shifts laterally | Shoulders |
| `push` | Both wrists move forward + arms raised | Wrists, Shoulders |
| `catch` | Both wrists close together, raised, forward | Wrists, Hips, Shoulders |
| `throw` | Single wrist high velocity (Y+Z) | Wrists |
| `duck` | Head drops below shoulder level | Nose, Shoulders |
| `wave` | Wrist oscillates side-to-side above shoulders | Wrists, Shoulders |
| `clap` | Both wrists converge rapidly while raised | Wrists, Hips |
| `punch` | Single wrist extends forward fast, other stays | Wrists |

## Current Status
- [x] Project scaffolded (Vite + React + TS)
- [x] MediaPipe PoseLandmarker integration (headless video)
- [x] Webcam stream + mirrored skeleton overlay
- [x] 10 detector functions (6 core + 4 extended)
- [x] Animated stick figure mission guides
- [x] Standalone demo page (single + combo mode)
- [x] Integration hook (useMotionGame) for Person C
- [x] B-format normalization (dodge direction compat)
- [x] Sample mission JSON for testing
- [ ] Threshold tuning with real testing
- [ ] Final integration with C's frontend + B's data
