/**
 * Timer-based mission trigger.
 *
 * The YouTube video plays via a plain <iframe> (no IFrame API needed).
 * We track elapsed real time since the video started and trigger missions
 * when timestamps are reached. The video never pauses — it is a game
 * background that keeps rolling even during missions.
 */
import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function useYouTubeSync() {
  const videoStartRef = useRef<number>(0)
  const lastVideoIdRef = useRef<string | null>(null)

  const phase = useGameStore((s) => s.phase)
  const currentVideoId = useGameStore((s) => s.currentVideoId)
  const missionQueue = useGameStore((s) => s.missionQueue)
  const firedTimestamps = useGameStore((s) => s.firedTimestamps)
  const triggerMission = useGameStore((s) => s.triggerMission)
  const clearRegion = useGameStore((s) => s.clearRegion)
  const setGameStartTime = useGameStore((s) => s.setGameStartTime)

  // Start timer when a new video begins playing
  useEffect(() => {
    if (phase === 'PLAYING' && currentVideoId) {
      if (currentVideoId !== lastVideoIdRef.current) {
        // Small delay to account for iframe load + buffering
        const startTime = Date.now() + 2000
        videoStartRef.current = startTime
        lastVideoIdRef.current = currentVideoId
        setGameStartTime(startTime)
        console.log('[YTSync] Timer started for video:', currentVideoId)
      }
    }

    if (phase === 'IDLE') {
      videoStartRef.current = 0
      lastVideoIdRef.current = null
    }
  }, [phase, currentVideoId])

  // Poll elapsed time and trigger missions
  useEffect(() => {
    if (phase !== 'PLAYING' || !currentVideoId || videoStartRef.current === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now < videoStartRef.current) return // Still in buffer grace period

      const elapsed = (now - videoStartRef.current) / 1000

      if (elapsed >= 60) {
        console.log('[YTSync] 60-second limit reached, clearing region')
        clearRegion()
        return
      }

      const next = missionQueue.find(
        (m) => elapsed >= m.timestamp && !firedTimestamps.has(m.timestamp)
      )

      if (next) {
        console.log(
          `[YTSync] Mission triggered at ${elapsed.toFixed(1)}s:`,
          next.missionType,
          next.prompt
        )
        firedTimestamps.add(next.timestamp)
        triggerMission(next)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [phase, currentVideoId, missionQueue, firedTimestamps, triggerMission, clearRegion])
}
