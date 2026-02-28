/**
 * useMotionGame — Integration hook for Person C.
 *
 * Connects webcam pose detection (A) with mission data from B,
 * synchronized to YouTube video playback timestamps.
 *
 * Uses the single-frame detectAction API with baseline capture
 * for hackathon-forgiving detection.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { usePoseDetection } from './usePoseDetection';
import { detectAction } from './detectors';
import type { MissionTimestamp, MissionResult, MissionType, Landmark } from './types';

type UseMotionGameOptions = {
  missions: MissionTimestamp[];
  onMissionResult?: (result: MissionResult, index: number) => void;
  onAllComplete?: (results: MissionResult[]) => void;
};

export function useMotionGame({ missions, onMissionResult, onAllComplete }: UseMotionGameOptions) {
  const { canvasRef, isReady, error, getLatestLandmarks } = usePoseDetection();
  const [activeMission, setActiveMission] = useState<MissionTimestamp | null>(null);
  const [activeMissionIndex, setActiveMissionIndex] = useState<number>(-1);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<MissionResult[]>([]);
  const [detecting, setDetecting] = useState(false);

  const baselineRef = useRef<Landmark[] | null>(null);
  const detectLoopRef = useRef<number>(0);
  const timerLoopRef = useRef<number>(0);
  const triggeredRef = useRef<Set<number>>(new Set());
  const allResultsRef = useRef<MissionResult[]>([]);

  useEffect(() => {
    triggeredRef.current = new Set();
    allResultsRef.current = [];
    setResults([]);
    setActiveMission(null);
    setActiveMissionIndex(-1);
    setLastResult(null);
  }, [missions]);

  const clearTimers = useCallback(() => {
    clearInterval(detectLoopRef.current);
    clearInterval(timerLoopRef.current);
  }, []);

  const normalizeMissionType = useCallback((mission: MissionTimestamp): MissionType => {
    if ((mission.missionType as string) === 'dodge' && mission.direction) {
      return mission.direction === 'left' ? 'dodge_left' : 'dodge_right';
    }
    return mission.missionType;
  }, []);

  const runDetection = useCallback(
    (mission: MissionTimestamp, index: number) => {
      clearTimers();
      const missionType = normalizeMissionType(mission);
      const timeLimit = mission.timeLimit || 3;

      // Capture baseline
      const baseline = getLatestLandmarks();
      if (!baseline) return;
      baselineRef.current = [...baseline];

      setActiveMission(mission);
      setActiveMissionIndex(index);
      setDetecting(true);
      setTimeLeft(timeLimit);
      setLastResult(null);

      const startTime = Date.now();

      timerLoopRef.current = window.setInterval(() => {
        const remaining = Math.max(0, timeLimit - (Date.now() - startTime) / 1000);
        setTimeLeft(remaining);
      }, 50);

      detectLoopRef.current = window.setInterval(() => {
        const current = getLatestLandmarks();
        if (!current || !baselineRef.current) return;

        const hit = detectAction(current, baselineRef.current, missionType);
        const elapsed = (Date.now() - startTime) / 1000;

        const done = (success: boolean) => {
          clearTimers();
          const r: MissionResult = { missionType, success, confidence: success ? 0.9 : 0 };
          setLastResult(r);
          setDetecting(false);
          setActiveMission(null);
          setActiveMissionIndex(-1);

          allResultsRef.current = [...allResultsRef.current, r];
          setResults([...allResultsRef.current]);

          onMissionResult?.(r, index);
          if (allResultsRef.current.length === missions.length) {
            onAllComplete?.(allResultsRef.current);
          }
        };

        if (hit) done(true);
        else if (elapsed >= timeLimit) done(false);
      }, 33);
    },
    [clearTimers, getLatestLandmarks, missions.length, normalizeMissionType, onMissionResult, onAllComplete]
  );

  const feedVideoTime = useCallback(
    (currentTime: number) => {
      if (!isReady || detecting) return;
      for (let i = 0; i < missions.length; i++) {
        if (triggeredRef.current.has(i)) continue;
        const m = missions[i];
        if (currentTime >= m.timestamp && currentTime < m.timestamp + 0.5) {
          triggeredRef.current.add(i);
          runDetection(m, i);
          break;
        }
      }
    },
    [isReady, detecting, missions, runDetection]
  );

  const startMission = useCallback(
    (missionType: MissionType, timeLimit = 3) => {
      const mission: MissionTimestamp = { timestamp: 0, missionType, prompt: '', timeLimit };
      runDetection(mission, allResultsRef.current.length);
    },
    [runDetection]
  );

  const score = {
    success: results.filter((r) => r.success).length,
    total: results.length,
  };

  useEffect(() => clearTimers, [clearTimers]);

  return {
    canvasRef, isReady, error,
    activeMission, activeMissionIndex, lastResult, timeLeft, detecting,
    results, score,
    feedVideoTime, startMission, getLatestLandmarks,
  };
}
