import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { RegionMissionData } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data', 'pregenerated')

function toFileName(regionName: string): string {
  return regionName.toLowerCase().replace(/\s+/g, '-')
}

export async function loadCachedMissions(regionName: string): Promise<RegionMissionData | null> {
  try {
    const filePath = join(DATA_DIR, `${toFileName(regionName)}.json`)
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data) as RegionMissionData
  } catch {
    return null
  }
}

export async function saveMissionsToCache(data: RegionMissionData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const filePath = join(DATA_DIR, `${toFileName(data.regionName)}.json`)
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function listCachedRegions(): Promise<string[]> {
  try {
    const files = await readdir(DATA_DIR)
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  } catch {
    return []
  }
}
