/**
 * Async mission loader that maps city names (from Google Maps or marker clicks)
 * to our pregenerated region data for Korean cities.
 */
import type { RegionMissionData } from '../motion/types';
import { getMissionsForRegion, getAvailableRegions } from './index';

// Map from city name → pregenerated region key
export const CITY_TO_REGION: Record<string, string> = {
  // English
  'Seoul': 'seoul',
  'Busan': 'busan',
  'Incheon': 'incheon',
  'Daegu': 'daegu',
  'Daejeon': 'daejeon',
  'Gwangju': 'gwangju',
  'Suwon': 'suwon',
  'Jeju': 'jeju',
  // Korean
  '서울': 'seoul', '서울특별시': 'seoul',
  '부산': 'busan', '부산광역시': 'busan',
  '인천': 'incheon', '인천광역시': 'incheon',
  '대구': 'daegu', '대구광역시': 'daegu',
  '대전': 'daejeon', '대전광역시': 'daejeon',
  '광주': 'gwangju', '광주광역시': 'gwangju',
  '수원': 'suwon', '수원시': 'suwon',
  '제주': 'jeju', '제주시': 'jeju', '제주특별자치도': 'jeju',
  // Country-level clicks within South Korea → default to Seoul
  'South Korea': 'seoul', 'Korea': 'seoul', '대한민국': 'seoul',
};

export function isValidRegion(cityName: string): boolean {
  if (cityName in CITY_TO_REGION) return true;
  const normalized = cityName.toLowerCase().replace(/\s+/g, '-');
  return getAvailableRegions().includes(normalized);
}

// Fallback missions for unknown cities
function createFallbackMissions(regionName: string): RegionMissionData {
  const fallback = getMissionsForRegion('seoul');
  if (fallback) {
    return { ...fallback, regionName };
  }

  return {
    videoId: 'mJt8G2cLMXI',
    regionName,
    missions: [
      { timestamp: 8, missionType: 'jump', prompt: '점프하세요!', timeLimit: 3 },
      { timestamp: 20, missionType: 'dodge_left', prompt: '왼쪽으로 피하세요!', timeLimit: 3 },
      { timestamp: 35, missionType: 'catch', prompt: '잡으세요!', timeLimit: 3 },
      { timestamp: 50, missionType: 'push', prompt: '밀어요!', timeLimit: 3 },
      { timestamp: 65, missionType: 'throw', prompt: '던지세요!', timeLimit: 3 },
    ],
  };
}

export async function getMissionsForRegionAsync(regionName: string): Promise<RegionMissionData> {
  // Try direct mapping from city name
  const regionKey = CITY_TO_REGION[regionName];
  if (regionKey) {
    const data = getMissionsForRegion(regionKey);
    if (data) {
      return { ...data, regionName };
    }
  }

  // Try treating the name as a region key directly (lowercase)
  const available = getAvailableRegions();
  const normalizedInput = regionName.toLowerCase().replace(/\s+/g, '-');
  if (available.includes(normalizedInput)) {
    const data = getMissionsForRegion(normalizedInput);
    if (data) {
      return { ...data, regionName };
    }
  }

  // Fallback: use Seoul data with the selected region name
  return createFallbackMissions(regionName);
}
