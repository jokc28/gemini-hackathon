// Core 6 types — B module generates these via Gemini
export type CoreMissionType = 'jump' | 'dodge_left' | 'dodge_right' | 'push' | 'catch' | 'throw';

// Extended types — A module extras for combo mode
export type ExtendedMissionType = 'duck' | 'wave' | 'clap' | 'punch';

// All supported mission types
export type MissionType = CoreMissionType | ExtendedMissionType;

// B module's per-timestamp mission
export type MissionTimestamp = {
  timestamp: number;
  missionType: MissionType;
  prompt: string;
  timeLimit: number;
  direction?: 'left' | 'right';
};

// Detection result — shared contract
export type MissionResult = {
  missionType: MissionType;
  success: boolean;
  confidence: number;
};

// B module's region output
export type RegionMissionData = {
  videoId: string;
  videoTitle?: string;  // added by B module
  regionName: string;
  missions: MissionTimestamp[];
};

// B module: YouTube search result
export type VideoSearchResult = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

// Single normalized landmark point
export type Landmark = {
  x: number;  // 0-1, left to right in camera frame
  y: number;  // 0-1, top to bottom
  z: number;  // depth, negative = closer to camera
  visibility: number;
};

// A single frame of pose data
export type LandmarkFrame = {
  landmarks: Landmark[];
  timestamp: number;
};
