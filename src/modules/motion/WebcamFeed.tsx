/**
 * WebcamFeed — Hidden engine for pose detection.
 *
 * The canvas and overlays are visually hidden but the MediaPipe engine
 * keeps running so detection works in the background. We use off-screen
 * positioning (not display:none) because canvas needs non-zero dimensions
 * for getContext('2d') to work in the RAF loop.
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePoseDetection } from './usePoseDetection';
import { detectAction } from './detectors';
import type { MissionType, Landmark } from './types';
import type { WebcamFeedProps } from '../ui/types';

export function WebcamFeed({ activeMissionType, onMissionResult }: WebcamFeedProps) {
  const { canvasRef, isReady, error, getLatestLandmarks } = usePoseDetection({
    drawSkeleton: false,
  });

  const baselineRef = useRef<Landmark[] | null>(null);
  const detectLoopRef = useRef<number>(0);
  const activeMissionRef = useRef<MissionType | null>(null);

  // Keep ref in sync so the detection loop closure always has latest value
  activeMissionRef.current = activeMissionType;

  const stopDetection = useCallback(() => {
    if (detectLoopRef.current) {
      clearInterval(detectLoopRef.current);
      detectLoopRef.current = 0;
    }
    baselineRef.current = null;
  }, []);

  useEffect(() => {
    // Mission ended or cleared
    if (!activeMissionType) {
      stopDetection();
      return;
    }

    // Mission started — capture baseline and begin detection
    if (!isReady) return;

    const baseline = getLatestLandmarks();
    if (!baseline) return;
    baselineRef.current = [...baseline];

    detectLoopRef.current = window.setInterval(() => {
      const current = getLatestLandmarks();
      if (!current || !baselineRef.current || !activeMissionRef.current) return;

      const hit = detectAction(current, baselineRef.current, activeMissionRef.current);

      if (hit) {
        const missionType = activeMissionRef.current;
        stopDetection();
        onMissionResult({
          missionType,
          success: true,
          confidence: 0.9,
        });
      }
    }, 33); // ~30fps

    return () => stopDetection();
  }, [activeMissionType, isReady, getLatestLandmarks, onMissionResult, stopDetection]);

  // Cleanup on unmount
  useEffect(() => () => stopDetection(), [stopDetection]);

  if (error) {
    console.error('[WebcamFeed] Pose detection error:', error);
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}
