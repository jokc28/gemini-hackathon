// Primary integration hook for Person C
export { useMotionGame } from './useMotionGame';

// Lower-level hooks & functions
export { usePoseDetection } from './usePoseDetection';
export { detectMission, detectJump, detectDodge, detectPush, detectCatch, detectThrow, detectDuck, detectWave, detectClap, detectPunch } from './detectors';

// Combo mode
export { COMBO_SEQUENCES } from './comboSequences';
export type { ComboSequence } from './comboSequences';

// UI components
export { MissionGuide } from './MissionGuide';

// Types — matches shared team contract
export type { MissionType, CoreMissionType, ExtendedMissionType, MissionResult, MissionTimestamp, RegionMissionData, LandmarkFrame } from './types';
