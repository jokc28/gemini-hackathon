import type { LandmarkFrame, MissionType, MissionResult } from './types';

// MediaPipe Pose landmark indices
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const NOSE = 0;

function avg(a: number, b: number) {
  return (a + b) / 2;
}

function getHipY(frame: LandmarkFrame): number {
  return avg(frame.landmarks[LEFT_HIP].y, frame.landmarks[RIGHT_HIP].y);
}

function getShoulderX(frame: LandmarkFrame): number {
  return avg(frame.landmarks[LEFT_SHOULDER].x, frame.landmarks[RIGHT_SHOULDER].x);
}

function getShoulderY(frame: LandmarkFrame): number {
  return avg(frame.landmarks[LEFT_SHOULDER].y, frame.landmarks[RIGHT_SHOULDER].y);
}

// --- Original 6 detectors ---

export function detectJump(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 8) return miss('jump');
  const hipYs = frames.map(getHipY);
  const baseline = hipYs[0];
  const minY = Math.min(...hipYs);
  const rise = baseline - minY;
  const threshold = 0.06;
  return { missionType: 'jump', success: rise > threshold, confidence: Math.min(rise / 0.12, 1) };
}

export function detectDodge(frames: LandmarkFrame[], direction: 'left' | 'right'): MissionResult {
  const missionType: MissionType = direction === 'left' ? 'dodge_left' : 'dodge_right';
  if (frames.length < 6) return miss(missionType);
  const xs = frames.map(getShoulderX);
  const baseline = xs[0];
  const diffs = xs.map((x) => x - baseline);
  const maxShift = direction === 'left' ? Math.max(...diffs) : Math.max(...diffs.map((d) => -d));
  const threshold = 0.08;
  return { missionType, success: maxShift > threshold, confidence: Math.min(maxShift / 0.15, 1) };
}

export function detectPush(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('push');
  const first = frames[0];
  const last = frames[frames.length - 1];
  const wristZStart = avg(first.landmarks[LEFT_WRIST].z, first.landmarks[RIGHT_WRIST].z);
  const wristZEnd = avg(last.landmarks[LEFT_WRIST].z, last.landmarks[RIGHT_WRIST].z);
  const wristYEnd = avg(last.landmarks[LEFT_WRIST].y, last.landmarks[RIGHT_WRIST].y);
  const shoulderYEnd = getShoulderY(last);
  const armsRaised = wristYEnd < shoulderYEnd + 0.1;
  const zForward = wristZStart - wristZEnd;
  const threshold = 0.05;
  return { missionType: 'push', success: zForward > threshold && armsRaised, confidence: Math.min(zForward / 0.1, 1) };
}

export function detectCatch(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('catch');
  const last = frames[frames.length - 1];
  const lw = last.landmarks[LEFT_WRIST];
  const rw = last.landmarks[RIGHT_WRIST];
  const wristDist = Math.abs(lw.x - rw.x);
  const close = wristDist < 0.25;
  const hipY = getHipY(last);
  const wristY = avg(lw.y, rw.y);
  const raised = wristY < hipY;
  const shoulderZ = avg(last.landmarks[LEFT_SHOULDER].z, last.landmarks[RIGHT_SHOULDER].z);
  const wristZ = avg(lw.z, rw.z);
  const forward = wristZ < shoulderZ;
  const success = close && raised && forward;
  const rawConf = (close ? 0.33 : 0) + (raised ? 0.33 : 0) + (forward ? 0.34 : 0);
  return { missionType: 'catch', success, confidence: Math.min(rawConf, 1) };
}

export function detectThrow(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('throw');
  const recentFrames = frames.slice(-6);
  let maxVelocity = 0;
  for (let i = 1; i < recentFrames.length; i++) {
    const prev = recentFrames[i - 1];
    const curr = recentFrames[i];
    const dt = (curr.timestamp - prev.timestamp) / 1000;
    if (dt === 0) continue;
    for (const wristIdx of [LEFT_WRIST, RIGHT_WRIST]) {
      const dz = prev.landmarks[wristIdx].z - curr.landmarks[wristIdx].z;
      const dy = prev.landmarks[wristIdx].y - curr.landmarks[wristIdx].y;
      const velocity = Math.sqrt(dz * dz + dy * dy) / dt;
      maxVelocity = Math.max(maxVelocity, velocity);
    }
  }
  const threshold = 0.8;
  return { missionType: 'throw', success: maxVelocity > threshold, confidence: Math.min(maxVelocity / 1.5, 1) };
}

// --- New detectors ---

/**
 * detectDuck: head (nose) drops below shoulder level — crouching/ducking.
 */
export function detectDuck(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('duck');
  const first = frames[0];
  const last = frames[frames.length - 1];
  const noseYStart = first.landmarks[NOSE].y;
  const noseYEnd = last.landmarks[NOSE].y;
  const shoulderYEnd = getShoulderY(last);
  // Nose dropped significantly AND nose is near/below shoulder line
  const drop = noseYEnd - noseYStart; // positive = moved down
  const nearShoulders = noseYEnd > shoulderYEnd - 0.05;
  const threshold = 0.06;
  const success = drop > threshold && nearShoulders;
  return { missionType: 'duck', success, confidence: Math.min(drop / 0.12, 1) };
}

/**
 * detectWave: one wrist oscillates laterally above shoulder level (side-to-side).
 */
export function detectWave(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 10) return miss('wave');

  let bestScore = 0;
  for (const wristIdx of [LEFT_WRIST, RIGHT_WRIST]) {
    const xs = frames.map((f) => f.landmarks[wristIdx].x);
    const ys = frames.map((f) => f.landmarks[wristIdx].y);
    const shoulderYs = frames.map(getShoulderY);

    // Check wrist is above shoulder for most frames
    const aboveCount = ys.filter((y, i) => y < shoulderYs[i]).length;
    if (aboveCount < frames.length * 0.5) continue;

    // Count direction changes in x (oscillations)
    let directionChanges = 0;
    for (let i = 2; i < xs.length; i++) {
      const prevDir = xs[i - 1] - xs[i - 2];
      const currDir = xs[i] - xs[i - 1];
      if (prevDir * currDir < 0 && Math.abs(currDir) > 0.005) {
        directionChanges++;
      }
    }
    bestScore = Math.max(bestScore, directionChanges);
  }

  const threshold = 2; // at least 2 direction changes = wave
  const success = bestScore >= threshold;
  return { missionType: 'wave', success, confidence: Math.min(bestScore / 4, 1) };
}

/**
 * detectClap: both wrists start apart and rapidly come close together.
 */
export function detectClap(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('clap');

  const distances = frames.map((f) => {
    const lw = f.landmarks[LEFT_WRIST];
    const rw = f.landmarks[RIGHT_WRIST];
    return Math.sqrt((lw.x - rw.x) ** 2 + (lw.y - rw.y) ** 2);
  });

  const maxDist = Math.max(...distances.slice(0, Math.floor(distances.length / 2)));
  const minDist = Math.min(...distances.slice(Math.floor(distances.length / 2)));
  const convergence = maxDist - minDist;

  // Wrists must also be above hips
  const last = frames[frames.length - 1];
  const hipY = getHipY(last);
  const wristY = avg(last.landmarks[LEFT_WRIST].y, last.landmarks[RIGHT_WRIST].y);
  const raised = wristY < hipY;

  const threshold = 0.15;
  const success = convergence > threshold && minDist < 0.1 && raised;
  return { missionType: 'clap', success, confidence: Math.min(convergence / 0.25, 1) };
}

/**
 * detectPunch: one wrist rapidly extends forward (z decreases) while the other stays back.
 * Differs from push: only ONE arm, and faster velocity required.
 */
export function detectPunch(frames: LandmarkFrame[]): MissionResult {
  if (frames.length < 6) return miss('punch');
  const recentFrames = frames.slice(-6);
  let bestPunchScore = 0;

  for (const [punchWrist, otherWrist] of [[LEFT_WRIST, RIGHT_WRIST], [RIGHT_WRIST, LEFT_WRIST]]) {
    let maxVel = 0;
    for (let i = 1; i < recentFrames.length; i++) {
      const prev = recentFrames[i - 1];
      const curr = recentFrames[i];
      const dt = (curr.timestamp - prev.timestamp) / 1000;
      if (dt === 0) continue;
      const dz = prev.landmarks[punchWrist].z - curr.landmarks[punchWrist].z;
      const vel = dz / dt; // positive = forward
      maxVel = Math.max(maxVel, vel);
    }

    // Other wrist should be relatively still (not both extending = push)
    const otherZ0 = recentFrames[0].landmarks[otherWrist].z;
    const otherZ1 = recentFrames[recentFrames.length - 1].landmarks[otherWrist].z;
    const otherMoved = Math.abs(otherZ0 - otherZ1);
    const oneArm = otherMoved < 0.03;

    if (oneArm) {
      bestPunchScore = Math.max(bestPunchScore, maxVel);
    }
  }

  const threshold = 0.5;
  const success = bestPunchScore > threshold;
  return { missionType: 'punch', success, confidence: Math.min(bestPunchScore / 1.0, 1) };
}

// --- Utility ---

function miss(type: MissionType): MissionResult {
  return { missionType: type, success: false, confidence: 0 };
}

export function detectMission(missionType: MissionType, frames: LandmarkFrame[]): MissionResult {
  switch (missionType) {
    case 'jump': return detectJump(frames);
    case 'dodge_left': return detectDodge(frames, 'left');
    case 'dodge_right': return detectDodge(frames, 'right');
    case 'push': return detectPush(frames);
    case 'catch': return detectCatch(frames);
    case 'throw': return detectThrow(frames);
    case 'duck': return detectDuck(frames);
    case 'wave': return detectWave(frames);
    case 'clap': return detectClap(frames);
    case 'punch': return detectPunch(frames);
  }
}
