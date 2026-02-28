import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import type { LandmarkFrame, Landmark } from './types';

const FRAME_BUFFER_SIZE = 20;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export type UsePoseDetectionOptions = {
  /** Draw skeleton overlay on canvas. Default true. */
  drawSkeleton?: boolean;
  /** Mirror the video + skeleton horizontally (selfie mode). Default true. */
  mirror?: boolean;
};

export type UsePoseDetectionReturn = {
  /** Ref to attach to a visible <canvas> element. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** True once MediaPipe model is loaded AND webcam is streaming. */
  isReady: boolean;
  /** Non-null if init failed (permission denied, no camera, etc.). */
  error: string | null;
  /** Returns the latest N frames of raw landmark data. */
  getFrameBuffer: () => LandmarkFrame[];
  /** Returns the most recent single frame's landmarks, or null. */
  getLatestLandmarks: () => Landmark[] | null;
};

export function usePoseDetection(
  opts: UsePoseDetectionOptions = {}
): UsePoseDetectionReturn {
  const { drawSkeleton = true, mirror = true } = opts;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const frameBufferRef = useRef<LandmarkFrame[]>([]);
  const latestLandmarksRef = useRef<Landmark[] | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFrameBuffer = useCallback(() => frameBufferRef.current, []);
  const getLatestLandmarks = useCallback(() => latestLandmarksRef.current, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Create hidden video element
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;
        videoRef.current = video;

        // 2. Load MediaPipe WASM + model
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        if (cancelled) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        // 3. Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        setIsReady(true);
        loop(video);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('[usePoseDetection] init failed:', msg);
          setError(msg);
        }
      }
    }

    function loop(video: HTMLVideoElement) {
      const canvas = canvasRef.current;
      if (!canvas) {
        // Canvas not mounted yet — retry next frame
        animFrameRef.current = requestAnimationFrame(() => loop(video));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const drawUtils = drawSkeleton ? new DrawingUtils(ctx) : null;
      let lastTs = -1;

      function tick() {
        if (cancelled) return;
        const lm = landmarkerRef.current;
        if (!lm || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const now = performance.now();
        if (now === lastTs) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        lastTs = now;

        // Detect
        const result = lm.detectForVideo(video, now);

        // Size canvas to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        ctx.save();
        if (mirror) {
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // Process landmarks
        if (result.landmarks && result.landmarks.length > 0) {
          const raw = result.landmarks[0];

          // Store raw (un-mirrored) landmarks
          const landmarks: Landmark[] = raw.map((l) => ({
            x: l.x,
            y: l.y,
            z: l.z,
            visibility: l.visibility ?? 0,
          }));
          latestLandmarksRef.current = landmarks;

          // Push to ring buffer
          frameBufferRef.current.push({ landmarks, timestamp: now });
          if (frameBufferRef.current.length > FRAME_BUFFER_SIZE) {
            frameBufferRef.current.shift();
          }

          // Draw skeleton (mirrored for display)
          if (drawUtils) {
            const display = mirror
              ? raw.map((l) => ({ ...l, x: 1 - l.x }))
              : raw;

            drawUtils.drawLandmarks(display, {
              radius: 4,
              color: '#00FF00',
              fillColor: '#00FF00',
            });
            drawUtils.drawConnectors(
              display,
              PoseLandmarker.POSE_CONNECTIONS,
              { color: '#00FFFF', lineWidth: 2 }
            );
          }
        } else {
          latestLandmarksRef.current = null;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      }

      tick();
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
      landmarkerRef.current?.close();
    };
  }, [drawSkeleton, mirror]);

  return { canvasRef, isReady, error, getFrameBuffer, getLatestLandmarks };
}
