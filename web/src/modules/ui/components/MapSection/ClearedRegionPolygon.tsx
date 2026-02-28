import { Polygon } from '@react-google-maps/api'
import { REGION_POLYGONS } from './regionData'

interface Props {
  clearedRegions: string[]
}

export function ClearedRegionPolygon({ clearedRegions }: Props) {
  return (
    <>
      {clearedRegions.map((region) => {
        const paths = REGION_POLYGONS[region]
        if (!paths) return null
        return (
          <Polygon
            key={region}
            paths={paths}
            options={{
              fillColor: '#22c55e',
              fillOpacity: 0.45,
              strokeColor: '#16a34a',
              strokeWeight: 2,
            }}
          />
        )
      })}
    </>
  )
}
