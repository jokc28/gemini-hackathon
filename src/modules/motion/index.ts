// Primary integration hook for Person C
export { useMotionGame } from './useMotionGame';

// Lower-level hooks & functions
export { usePoseDetection } from './usePoseDetection';
export { detectAction, detectMission, getDebugValues } from './detectors';

// Combo mode
export { COMBO_SEQUENCES } from './comboSequences';
export type { ComboSequence } from './comboSequences';

// UI components
export { MissionGuide } from './MissionGuide';

// Types
export type { MissionType, CoreMissionType, ExtendedMissionType, MissionResult, MissionTimestamp, RegionMissionData, VideoSearchResult, LandmarkFrame, Landmark } from './types';
