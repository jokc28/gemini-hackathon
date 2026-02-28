import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MissionGuide } from '../../../motion/MissionGuide'

export function MissionOverlay() {
  const phase = useGameStore((s) => s.phase)
  const activeMission = useGameStore((s) => s.activeMission)
  const receiveMissionResult = useGameStore((s) => s.receiveMissionResult)
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase !== 'MISSION_ACTIVE' || !activeMission) return

    setTimeLeft(activeMission.timeLimit)

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          receiveMissionResult({
            missionType: activeMission.missionType,
            success: false,
            confidence: 0,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, activeMission, receiveMissionResult])

  if (phase !== 'MISSION_ACTIVE' || !activeMission) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
    >
      <p
        className="text-gray-300 text-sm mb-3 uppercase font-semibold"
        style={{ letterSpacing: '0.3em' }}
      >
        MISSION
      </p>
      <h1
        className="text-5xl md:text-6xl font-black text-white text-center mb-4 px-6 leading-tight"
        style={{
          textShadow:
            '0 0 20px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.8), 0 0 60px rgba(255,255,255,0.15)',
        }}
      >
        {activeMission.prompt}
      </h1>
      <div className="relative w-full flex-1 min-h-0">
        <MissionGuide mission={activeMission.missionType} timeLeft={timeLeft} />
      </div>
    </div>
  )
}
