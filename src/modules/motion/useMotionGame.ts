/**
 * useMotionGame — Integration hook for Person C's frontend.
 *
 * This is the primary API surface that C should use.
 * It connects the webcam/pose detection (A) with mission data from B,
 * synchronized to YouTube video playback timestamps.
 *
 * Usage in C's component:
 * ```tsx
 * const {
 *   canvasRef,           // attach to <canvas> for webcam + skeleton
 *   isReady,             // true when MediaPipe + webcam are loaded
 *   activeMission,       // current mission being detected (or null)
 *   lastResult,          // most recent MissionResult
 *   timeLeft,            // countdown for current mission
 *   score,               // { success: number, total: number }
 *   feedVideoTime,       // call this every frame with YouTube player's currentTime
 * } = useMotionGame({
 *   missions,            // MissionTimestamp[] from B module
 *   onMissionResult,     // callback: (result: MissionResult) => void
 *   onAllComplete,       // callback: (results: MissionResult[]) => void
 * });
 *
 * // In your YouTube player's timeupdate loop:
 * feedVideoTime(player.getCurrentTime());
 * ```
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { usePoseDetection } from './usePoseDetection';
import { detectMission } from './detectors';
import type { MissionTimestamp, MissionResult, MissionType } from './types';

type UseMotionGameOptions = {
  missions: MissionTimestamp[];
  onMissionResult?: (result: MissionResult, index: number) => void;
  onAllComplete?: (results: MissionResult[]) => void;
};

export function useMotionGame({ missions, onMissionResult, onAllComplete }: UseMotionGameOptions) {
  const { canvasRef, isReady, error, getFrameBuffer } = usePoseDetection();
  const [activeMission, setActiveMission] = useState<MissionTimestamp | null>(null);
  const [activeMissionIndex, setActiveMissionIndex] = useState<number>(-1);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<MissionResult[]>([]);
  const [detecting, setDetecting] = useState(false);

  const detectIntervalRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const triggeredRef = useRef<Set<number>>(new Set());
  const allResultsRef = useRef<MissionResult[]>([]);

  // Reset when missions change
  useEffect(() => {
    triggeredRef.current = new Set();
    allResultsRef.current = [];
    setResults([]);
    setActiveMission(null);
    setActiveMissionIndex(-1);
    setLastResult(null);
  }, [missions]);

  const clearTimers = useCallback(() => {
    clearInterval(detectIntervalRef.current);
    clearInterval(timerRef.current);
  }, []);

  // Normalize B's dodge format: { missionType: "dodge", direction: "left" } → "dodge_left"
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

      setActiveMission(mission);
      setActiveMissionIndex(index);
      setDetecting(true);
      setTimeLeft(timeLimit);
      setLastResult(null);

      const startTime = Date.now();

      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeLeft(Math.max(0, timeLimit - elapsed));
      }, 50);

      detectIntervalRef.current = window.setInterval(() => {
        const frames = getFrameBuffer();
        const result = detectMission(missionType, frames);

        const done = (r: MissionResult) => {
          clearTimers();
          setLastResult(r);
          setDetecting(false);
          setActiveMission(null);
          setActiveMissionIndex(-1);

          allResultsRef.current = [...allResultsRef.current, r];
          setResults([...allResultsRef.current]);

          onMissionResult?.(r, index);

          // Check if all missions done
          if (allResultsRef.current.length === missions.length) {
            onAllComplete?.(allResultsRef.current);
          }
        };

        if (result.success) {
          done(result);
        } else if (Date.now() - startTime > timeLimit * 1000) {
          done({ missionType, success: false, confidence: 0 });
        }
      }, 100);
    },
    [clearTimers, getFrameBuffer, missions.length, normalizeMissionType, onMissionResult, onAllComplete]
  );

  /**
   * feedVideoTime — call this with the YouTube player's currentTime (seconds).
   * When a mission's timestamp is reached, detection starts automatically.
   */
  const feedVideoTime = useCallback(
    (currentTime: number) => {
      if (!isReady || detecting) return;

      for (let i = 0; i < missions.length; i++) {
        if (triggeredRef.current.has(i)) continue;

        const mission = missions[i];
        // Trigger when video time reaches mission timestamp (within 0.5s window)
        if (currentTime >= mission.timestamp && currentTime < mission.timestamp + 0.5) {
          triggeredRef.current.add(i);
          runDetection(mission, i);
          break;
        }
      }
    },
    [isReady, detecting, missions, runDetection]
  );

  /**
   * startMission — manually trigger a specific mission (for testing or non-video use).
   * C can use this directly without video timestamp sync.
   */
  const startMission = useCallback(
    (missionType: MissionType, timeLimit = 3) => {
      const mission: MissionTimestamp = {
        timestamp: 0,
        missionType,
        prompt: '',
        timeLimit,
      };
      runDetection(mission, allResultsRef.current.length);
    },
    [runDetection]
  );

  const score = {
    success: results.filter((r) => r.success).length,
    total: results.length,
  };

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    // Webcam
    canvasRef,
    isReady,
    error,

    // Mission state
    activeMission,
    activeMissionIndex,
    lastResult,
    timeLeft,
    detecting,

    // Score
    results,
    score,

    // API for C
    feedVideoTime,
    startMission,
    getFrameBuffer,
  };
}
