/**
 * detectors.ts — Hackathon-forgiving motion detection.
 *
 * All detection uses UPPER BODY only (nose, shoulders, elbows, wrists).
 * Two APIs:
 *   detectAction(landmarks, baseline, mission)  → boolean  (single-frame, for game loop)
 *   detectMission(mission, frames)              → MissionResult (multi-frame, legacy)
 *
 * Thresholds are intentionally LOW for smooth demo experience.
 */
import type { Landmark, LandmarkFrame, MissionType, MissionResult } from './types';

// ── Landmark indices ──
const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;

// ── Helpers ──
function avg(a: number, b: number): number {
  return (a + b) / 2;
}

function dist2d(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function valid(lm: Landmark[], ...indices: number[]): boolean {
  return indices.every(
    (i) => lm[i] && lm[i].visibility > 0.3
  );
}

// ── Debug values (exposed for overlay) ──
export type DebugValues = {
  noseX: number;
  noseY: number;
  noseZ: number;
  shoulderMidX: number;
  shoulderMidY: number;
  wristDistL: number;
  wristDistR: number;
  wristMidY: number;
  wristGap: number;
};

export function getDebugValues(lm: Landmark[]): DebugValues {
  const nose = lm[NOSE];
  const shoulderMidX = avg(lm[L_SHOULDER].x, lm[R_SHOULDER].x);
  const shoulderMidY = avg(lm[L_SHOULDER].y, lm[R_SHOULDER].y);
  return {
    noseX: nose.x,
    noseY: nose.y,
    noseZ: nose.z,
    shoulderMidX,
    shoulderMidY,
    wristDistL: dist2d(lm[L_WRIST], lm[L_SHOULDER]),
    wristDistR: dist2d(lm[R_WRIST], lm[R_SHOULDER]),
    wristMidY: avg(lm[L_WRIST].y, lm[R_WRIST].y),
    wristGap: Math.abs(lm[L_WRIST].x - lm[R_WRIST].x),
  };
}

// ── Single-frame detection ──
// `baseline` = landmarks captured when mission starts (the "neutral" pose).
// `current`  = landmarks from the current frame.
// Returns true if the motion is detected.

export function detectAction(
  current: Landmark[],
  baseline: Landmark[],
  mission: MissionType
): boolean {
  if (!current || current.length < 17 || !baseline || baseline.length < 17) {
    return false;
  }

  switch (mission) {
    case 'jump':       return detectJumpSingle(current, baseline);
    case 'dodge_left':  return detectDodgeSingle(current, baseline, 'left');
    case 'dodge_right': return detectDodgeSingle(current, baseline, 'right');
    case 'push':       return detectPushSingle(current, baseline);
    case 'catch':      return detectCatchSingle(current);
    case 'throw':      return detectThrowSingle(current, baseline);
    case 'duck':       return detectDuckSingle(current, baseline);
    case 'wave':       return detectWaveSingle(current);
    case 'clap':       return detectClapSingle(current);
    case 'punch':      return detectPunchSingle(current, baseline);
  }
}

// ── JUMP: Nose Y goes UP (decreases) by 0.04 from baseline ──
function detectJumpSingle(cur: Landmark[], base: Landmark[]): boolean {
  if (!valid(cur, NOSE)) return false;
  const delta = base[NOSE].y - cur[NOSE].y; // positive = moved up
  return delta > 0.04;
}

// ── DODGE: Nose X shifts by 0.06 from baseline ──
// Raw camera: user moves LEFT in mirror = nose X INCREASES in raw coords.
function detectDodgeSingle(
  cur: Landmark[],
  base: Landmark[],
  direction: 'left' | 'right'
): boolean {
  if (!valid(cur, NOSE)) return false;
  const delta = cur[NOSE].x - base[NOSE].x;
  // User's left = raw X increases (camera sees them go right)
  return direction === 'left' ? delta > 0.06 : delta < -0.06;
}

// ── PUSH: Both wrist-to-shoulder distances extend by 0.05 ──
function detectPushSingle(cur: Landmark[], base: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST, L_SHOULDER, R_SHOULDER)) return false;
  const curDistL = dist2d(cur[L_WRIST], cur[L_SHOULDER]);
  const curDistR = dist2d(cur[R_WRIST], cur[R_SHOULDER]);
  const baseDistL = dist2d(base[L_WRIST], base[L_SHOULDER]);
  const baseDistR = dist2d(base[R_WRIST], base[R_SHOULDER]);
  const avgExtension = avg(curDistL - baseDistL, curDistR - baseDistR);
  return avgExtension > 0.05;
}

// ── CATCH: Both wrists close together (gap < 0.12) AND above shoulders ──
function detectCatchSingle(cur: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST, L_SHOULDER, R_SHOULDER)) return false;
  const gap = Math.abs(cur[L_WRIST].x - cur[R_WRIST].x);
  const wristY = avg(cur[L_WRIST].y, cur[R_WRIST].y);
  const shoulderY = avg(cur[L_SHOULDER].y, cur[R_SHOULDER].y);
  return gap < 0.15 && wristY < shoulderY;
}

// ── THROW: Either wrist moves far from baseline (distance > 0.12) ──
function detectThrowSingle(cur: Landmark[], base: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST)) return false;
  const dL = dist2d(cur[L_WRIST], base[L_WRIST]);
  const dR = dist2d(cur[R_WRIST], base[R_WRIST]);
  return Math.max(dL, dR) > 0.12;
}

// ── DUCK: Nose Y goes DOWN (increases) by 0.05 from baseline ──
function detectDuckSingle(cur: Landmark[], base: Landmark[]): boolean {
  if (!valid(cur, NOSE)) return false;
  const delta = cur[NOSE].y - base[NOSE].y; // positive = moved down
  return delta > 0.05;
}

// ── WAVE: Either wrist is above nose AND far from shoulder horizontally ──
function detectWaveSingle(cur: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST, NOSE, L_SHOULDER, R_SHOULDER)) return false;
  for (const [wrist, shoulder] of [[L_WRIST, L_SHOULDER], [R_WRIST, R_SHOULDER]] as const) {
    const aboveNose = cur[wrist].y < cur[NOSE].y;
    const farFromShoulder = Math.abs(cur[wrist].x - cur[shoulder].x) > 0.1;
    if (aboveNose && farFromShoulder) return true;
  }
  return false;
}

// ── CLAP: Both wrists close (gap < 0.08) AND both above hip-level (wrist Y < 0.65) ──
function detectClapSingle(cur: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST)) return false;
  const gap = Math.abs(cur[L_WRIST].x - cur[R_WRIST].x);
  const wristY = avg(cur[L_WRIST].y, cur[R_WRIST].y);
  return gap < 0.1 && wristY < 0.65;
}

// ── PUNCH: One wrist extends far forward (dist > 0.1) while other stays near baseline ──
function detectPunchSingle(cur: Landmark[], base: Landmark[]): boolean {
  if (!valid(cur, L_WRIST, R_WRIST)) return false;
  const dL = dist2d(cur[L_WRIST], base[L_WRIST]);
  const dR = dist2d(cur[R_WRIST], base[R_WRIST]);
  const one = Math.max(dL, dR);
  const other = Math.min(dL, dR);
  return one > 0.1 && other < 0.06;
}

// ── Multi-frame API (legacy compat for useMotionGame) ──

export function detectMission(
  missionType: MissionType,
  frames: LandmarkFrame[]
): MissionResult {
  if (frames.length < 3) return miss(missionType);

  const baseline = frames[0].landmarks;
  const current = frames[frames.length - 1].landmarks;
  const success = detectAction(current, baseline, missionType);

  // Compute a rough confidence from the middle of the buffer
  let confidence = 0;
  if (success) {
    const hits = frames.filter((f) =>
      detectAction(f.landmarks, baseline, missionType)
    ).length;
    confidence = Math.min(hits / frames.length + 0.3, 1);
  }

  return { missionType, success, confidence };
}

function miss(type: MissionType): MissionResult {
  return { missionType: type, success: false, confidence: 0 };
}
