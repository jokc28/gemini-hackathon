import { create } from 'zustand'
import type { MissionTimestamp, MissionResult } from '../../motion/types'
import { getMissionsForRegionAsync } from '../../missions/getMissionsForRegionAsync'

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
  isLoading: boolean
  score: number
  clearedRegions: string[]
  selectedRegion: string | null
  currentVideoId: string | null
  missionQueue: MissionTimestamp[]
  firedTimestamps: Set<number>
  activeMission: MissionTimestamp | null
  lastResult: MissionResult | null
  debugLog: string
  loadingError: string | null
  totalMissions: number
  clearedMissions: number
  gameStartTime: number | null

  selectRegion: (name: string) => void
  cancelRegion: () => void
  fetchRegionDataAndStart: (regionName: string) => Promise<void>
  startPlaying: () => void
  triggerMission: (mission: MissionTimestamp) => void
  receiveMissionResult: (result: MissionResult) => void
  clearRegion: () => void
  resetToIdle: () => void
  setGameStartTime: (time: number) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'IDLE',
  isLoading: false,
  score: 0,
  clearedRegions: [],
  selectedRegion: null,
  currentVideoId: null,
  missionQueue: [],
  firedTimestamps: new Set(),
  activeMission: null,
  lastResult: null,
  debugLog: '',
  loadingError: null,
  totalMissions: 0,
  clearedMissions: 0,
  gameStartTime: null,

  selectRegion: (name) =>
    set({ phase: 'REGION_SELECTED', selectedRegion: name, loadingError: null }),

  cancelRegion: () =>
    set({ phase: 'IDLE', selectedRegion: null, isLoading: false, loadingError: null }),

  fetchRegionDataAndStart: async (regionName: string) => {
    console.log('[gameStore] fetchRegionDataAndStart called with:', regionName)
    set({ isLoading: true, phase: 'LOADING', loadingError: null, debugLog: `Loading "${regionName}"...` })

    try {
      const data = await getMissionsForRegionAsync(regionName)
      const videoId = data.videoId
      const missions = data.missions

      if (!videoId) {
        throw new Error('No videoId returned from mission data')
      }
      if (!missions || missions.length === 0) {
        throw new Error('No missions returned from mission data')
      }

      const filtered = [...missions]
        .filter((m) => m.timestamp < 60)
        .sort((a, b) => a.timestamp - b.timestamp)

      set({
        phase: 'PLAYING',
        isLoading: false,
        currentVideoId: videoId,
        missionQueue: filtered,
        firedTimestamps: new Set(),
        totalMissions: filtered.length,
        clearedMissions: 0,
        gameStartTime: null,
        debugLog: `PLAYING! video=${videoId}, ${filtered.length} missions (filtered <60s)`,
      })
      console.log('[gameStore] state set to PLAYING')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[gameStore] fetchRegionDataAndStart ERROR:', msg, err)
      set({
        isLoading: false,
        loadingError: msg,
        debugLog: `ERROR: ${msg}`,
      })
    }
  },

  startPlaying: () =>
    set({ phase: 'PLAYING' }),

  triggerMission: (mission) =>
    set({ phase: 'MISSION_ACTIVE', activeMission: mission }),

  receiveMissionResult: (result) => {
    const { missionQueue, firedTimestamps, clearedMissions } = get()
    const remaining = missionQueue.filter(
      (m) => !firedTimestamps.has(m.timestamp)
    )
    set({
      phase: 'MISSION_RESULT',
      lastResult: result,
      missionQueue: remaining,
      clearedMissions: result.success ? clearedMissions + 1 : clearedMissions,
    })
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
      isLoading: false,
      selectedRegion: null,
      currentVideoId: null,
      missionQueue: [],
      firedTimestamps: new Set(),
      activeMission: null,
      lastResult: null,
      debugLog: '',
      loadingError: null,
      totalMissions: 0,
      clearedMissions: 0,
      gameStartTime: null,
    }),

  setGameStartTime: (time) => set({ gameStartTime: time }),
}))
