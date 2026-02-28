// Core 6 types from shared spec (B module generates these via Gemini)
export type CoreMissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw';

// Extended types (A module extras, for combo mode / future Gemini prompts)
export type ExtendedMissionType = 'duck' | 'wave' | 'clap' | 'punch';

// Union of all supported mission types
export type MissionType = CoreMissionType | ExtendedMissionType;

// Matches B module's output format exactly
export type MissionTimestamp = {
  timestamp: number;      // video playback second
  missionType: MissionType;
  prompt: string;         // display text e.g. "점프하세요!"
  timeLimit: number;      // detection window in seconds, default 3
  direction?: 'left' | 'right'; // optional, for B's dodge format compatibility
};

// Matches shared spec: { missionType, success, confidence }
export type MissionResult = {
  missionType: MissionType;
  success: boolean;
  confidence: number;
};

// B module's output: region → video + missions
export type RegionMissionData = {
  videoId: string;
  regionName: string;
  missions: MissionTimestamp[];
};

// Internal: pose landmark frame buffer
export type LandmarkFrame = {
  landmarks: { x: number; y: number; z: number; visibility: number }[];
  timestamp: number;
};
