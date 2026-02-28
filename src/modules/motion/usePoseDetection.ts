import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { LandmarkFrame } from './types';

const FRAME_BUFFER_SIZE = 15;

export function usePoseDetection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameBufferRef = useRef<LandmarkFrame[]>([]);

  const getFrameBuffer = useCallback(() => frameBufferRef.current, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Create a hidden video element programmatically (no DOM attachment needed)
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;
        videoElRef.current = video;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (cancelled) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (cancelled) return;
        landmarkerRef.current = landmarker;

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
        startDetectionLoop(video);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to initialize';
          console.error('Motion init error:', e);
          setError(msg);
        }
      }
    }

    function startDetectionLoop(video: HTMLVideoElement) {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Canvas element not found');
        return;
      }
      const ctx = canvas.getContext('2d')!;
      const drawingUtils = new DrawingUtils(ctx);
      let lastTimestamp = -1;

      function detect() {
        if (cancelled) return;

        if (!landmarkerRef.current || video.readyState < 2) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }

        const now = performance.now();
        if (now === lastTimestamp) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }
        lastTimestamp = now;

        const result = landmarkerRef.current.detectForVideo(video, now);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame (mirrored)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];

          // Mirror landmarks for display
          const mirrored = landmarks.map((l) => ({ ...l, x: 1 - l.x }));

          drawingUtils.drawLandmarks(mirrored, {
            radius: 3,
            color: '#00FF00',
            fillColor: '#00FF00',
          });
          drawingUtils.drawConnectors(mirrored, PoseLandmarker.POSE_CONNECTIONS, {
            color: '#00FFFF',
            lineWidth: 2,
          });

          // Store raw (unmirrored) landmarks in frame buffer
          const frame: LandmarkFrame = {
            landmarks: landmarks.map((l) => ({
              x: l.x,
              y: l.y,
              z: l.z,
              visibility: l.visibility ?? 0,
            })),
            timestamp: now,
          };

          frameBufferRef.current.push(frame);
          if (frameBufferRef.current.length > FRAME_BUFFER_SIZE) {
            frameBufferRef.current.shift();
          }
        }

        animationRef.current = requestAnimationFrame(detect);
      }

      detect();
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationRef.current);
      if (videoElRef.current?.srcObject) {
        (videoElRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      landmarkerRef.current?.close();
    };
  }, []);

  return { canvasRef, isReady, error, getFrameBuffer };
}
