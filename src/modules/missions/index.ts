/**
 * Frontend mission loader — loads pregenerated mission data for Korean cities.
 */
import type { RegionMissionData } from '../motion/types';

// Static imports of pregenerated JSON (Vite handles these at build time)
import seoulData from '../../data/pregenerated/seoul.json';
import busanData from '../../data/pregenerated/busan.json';
import incheonData from '../../data/pregenerated/incheon.json';
import daeguData from '../../data/pregenerated/daegu.json';
import daejeonData from '../../data/pregenerated/daejeon.json';
import gwangjuData from '../../data/pregenerated/gwangju.json';
import suwonData from '../../data/pregenerated/suwon.json';
import jejuData from '../../data/pregenerated/jeju.json';

const PREGENERATED: Record<string, RegionMissionData> = {
  seoul: seoulData as unknown as RegionMissionData,
  busan: busanData as unknown as RegionMissionData,
  incheon: incheonData as unknown as RegionMissionData,
  daegu: daeguData as unknown as RegionMissionData,
  daejeon: daejeonData as unknown as RegionMissionData,
  gwangju: gwangjuData as unknown as RegionMissionData,
  suwon: suwonData as unknown as RegionMissionData,
  jeju: jejuData as unknown as RegionMissionData,
};

/**
 * Get available region names.
 */
export function getAvailableRegions(): string[] {
  return Object.keys(PREGENERATED);
}

/**
 * Load pregenerated mission data for a region.
 * Returns null if region is not found.
 */
export function getMissionsForRegion(regionName: string): RegionMissionData | null {
  const key = regionName.toLowerCase().replace(/\s+/g, '-');
  return PREGENERATED[key] ?? null;
}

/**
 * Get all pregenerated mission data.
 */
export function getAllRegionData(): Record<string, RegionMissionData> {
  return { ...PREGENERATED };
}
