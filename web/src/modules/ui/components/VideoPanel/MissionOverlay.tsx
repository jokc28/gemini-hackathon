import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

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
  }, [phase, activeMission])

  if (phase !== 'MISSION_ACTIVE' || !activeMission) return null

  const urgency = timeLeft <= 1 ? 'text-red-400' : timeLeft <= 2 ? 'text-yellow-400' : 'text-white'

  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
      <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">MISSION</p>
      <h1 className="text-4xl font-black text-white text-center mb-6 animate-bounce px-4">
        {activeMission.prompt}
      </h1>
      <div className={`text-7xl font-black ${urgency} transition-colors`}>
        {timeLeft}
      </div>
    </div>
  )
}
