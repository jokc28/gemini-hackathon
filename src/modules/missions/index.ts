/**
 * Frontend mission loader — loads pregenerated mission data from B module.
 *
 * Usage by Person C:
 * ```ts
 * import { getMissionsForRegion, getAvailableRegions } from './modules/missions';
 *
 * const regions = getAvailableRegions();  // ['tokyo', 'paris', 'seoul', ...]
 * const data = await getMissionsForRegion('tokyo');
 * // → { videoId, videoTitle, regionName, missions: MissionTimestamp[] }
 * ```
 */
import type { RegionMissionData } from '../motion/types';

// Static imports of pregenerated JSON (Vite handles these at build time)
import tokyoData from '../../data/pregenerated/tokyo.json';
import parisData from '../../data/pregenerated/paris.json';
import seoulData from '../../data/pregenerated/seoul.json';
import londonData from '../../data/pregenerated/london.json';
import newYorkData from '../../data/pregenerated/new-york.json';

const PREGENERATED: Record<string, RegionMissionData> = {
  tokyo: tokyoData as unknown as RegionMissionData,
  paris: parisData as unknown as RegionMissionData,
  seoul: seoulData as unknown as RegionMissionData,
  london: londonData as unknown as RegionMissionData,
  'new-york': newYorkData as unknown as RegionMissionData,
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
