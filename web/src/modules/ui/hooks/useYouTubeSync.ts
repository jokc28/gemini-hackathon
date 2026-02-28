import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

// YouTube IFrame Player API 타입 (window.YT)
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
  interface YTPlayer {
    getCurrentTime: () => number
    pauseVideo: () => void
    playVideo: () => void
    loadVideoById: (videoId: string) => void
    destroy: () => void
  }
}

export function useYouTubeSync(containerId: string) {
  const playerRef = useRef<YTPlayer | null>(null)
  const apiReadyRef = useRef(false)

  const phase = useGameStore((s) => s.phase)
  const currentVideoId = useGameStore((s) => s.currentVideoId)
  const missionQueue = useGameStore((s) => s.missionQueue)
  const firedTimestamps = useGameStore((s) => s.firedTimestamps)
  const triggerMission = useGameStore((s) => s.triggerMission)

  // YouTube IFrame API 로드
  useEffect(() => {
    if (window.YT) {
      apiReadyRef.current = true
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true
    }
  }, [])

  // 영상 ID 변경 시 플레이어 초기화
  useEffect(() => {
    if (!currentVideoId || phase !== 'PLAYING') return

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(currentVideoId)
        return
      }

      playerRef.current = new window.YT.Player(containerId, {
        videoId: currentVideoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            event.target.playVideo()
          },
        },
      })
    }

    if (apiReadyRef.current) {
      initPlayer()
    } else {
      const originalReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        originalReady?.()
        apiReadyRef.current = true
        initPlayer()
      }
    }
  }, [currentVideoId, phase, containerId])

  // MISSION_RESULT → PLAYING 복귀 시 영상 재개
  useEffect(() => {
    if (phase === 'PLAYING' && playerRef.current) {
      playerRef.current.playVideo()
    }
  }, [phase])

  // 타임스탬프 폴링 (100ms)
  useEffect(() => {
    if (phase !== 'PLAYING') return

    const interval = setInterval(() => {
      if (!playerRef.current) return
      const currentTime = playerRef.current.getCurrentTime()

      const next = missionQueue.find(
        (m) => currentTime >= m.timestamp && !firedTimestamps.has(m.timestamp)
      )

      if (next) {
        firedTimestamps.add(next.timestamp)
        playerRef.current.pauseVideo()
        triggerMission(next)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [phase, missionQueue, firedTimestamps, triggerMission])

  // 컴포넌트 언마운트 시 플레이어 정리
  useEffect(() => {
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  return { playerRef }
}
