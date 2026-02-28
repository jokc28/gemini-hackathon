import { create } from 'zustand'
import type { MissionTimestamp, MissionResult } from '../../../shared/types'

export type GamePhase =
  | 'IDLE'
  | 'REGION_SELECTED'
  | 'LOADING'
  | 'PLAYING'
  | 'MISSION_ACTIVE'
  | 'MISSION_RESULT'
  | 'REGION_CLEARED'

interface GameStore {
  phase: GamePhase
  score: number
  clearedRegions: string[]
  selectedRegion: string | null
  currentVideoId: string | null
  missionQueue: MissionTimestamp[]
  firedTimestamps: Set<number>
  activeMission: MissionTimestamp | null
  lastResult: MissionResult | null

  // 액션
  selectRegion: (name: string) => void
  cancelRegion: () => void
  startLoading: () => void
  setMissionData: (videoId: string, missions: MissionTimestamp[]) => void
  startPlaying: () => void
  triggerMission: (mission: MissionTimestamp) => void
  receiveMissionResult: (result: MissionResult) => void
  clearRegion: () => void
  resetToIdle: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'IDLE',
  score: 0,
  clearedRegions: [],
  selectedRegion: null,
  currentVideoId: null,
  missionQueue: [],
  firedTimestamps: new Set(),
  activeMission: null,
  lastResult: null,

  selectRegion: (name) =>
    set({ phase: 'REGION_SELECTED', selectedRegion: name }),

  cancelRegion: () =>
    set({ phase: 'IDLE', selectedRegion: null }),

  startLoading: () =>
    set({ phase: 'LOADING' }),

  setMissionData: (videoId, missions) =>
    set({
      currentVideoId: videoId,
      missionQueue: [...missions].sort((a, b) => a.timestamp - b.timestamp),
      firedTimestamps: new Set(),
    }),

  startPlaying: () =>
    set({ phase: 'PLAYING' }),

  triggerMission: (mission) =>
    set({ phase: 'MISSION_ACTIVE', activeMission: mission }),

  receiveMissionResult: (result) => {
    const { missionQueue, firedTimestamps } = get()
    const remaining = missionQueue.filter(
      (m) => !firedTimestamps.has(m.timestamp)
    )
    set({ phase: 'MISSION_RESULT', lastResult: result, missionQueue: remaining })
  },

  clearRegion: () => {
    const { selectedRegion, score, clearedRegions } = get()
    if (!selectedRegion) return
    set({
      phase: 'REGION_CLEARED',
      score: score + 1,
      clearedRegions: clearedRegions.includes(selectedRegion)
        ? clearedRegions
        : [...clearedRegions, selectedRegion],
    })
  },

  resetToIdle: () =>
    set({
      phase: 'IDLE',
      selectedRegion: null,
      currentVideoId: null,
      missionQueue: [],
      firedTimestamps: new Set(),
      activeMission: null,
      lastResult: null,
    }),
}))
