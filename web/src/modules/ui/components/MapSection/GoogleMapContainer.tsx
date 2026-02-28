import { useCallback } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { useGameStore } from '../../store/gameStore'
import { ClearedRegionPolygon } from './ClearedRegionPolygon'

const MAP_CENTER = { lat: 20, lng: 0 }
const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 2,
  minZoom: 2,
  maxZoom: 6,
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e1626' }],
    },
    {
      featureType: 'administrative.country',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4b6878' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#2c3e50' }],
    },
  ],
}

const LIBRARIES: ('geometry' | 'geocoding')[] = []

export function GoogleMapContainer() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  const phase = useGameStore((s) => s.phase)
  const clearedRegions = useGameStore((s) => s.clearedRegions)
  const selectRegion = useGameStore((s) => s.selectRegion)

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return
      if (phase !== 'IDLE') return

      const geocoder = new google.maps.Geocoder()
      try {
        const { results } = await geocoder.geocode({ location: event.latLng })
        const countryResult = results.find((r) =>
          r.types.includes('country')
        )
        if (countryResult) {
          const countryName = countryResult.address_components[0].long_name
          selectRegion(countryName)
        }
      } catch (err) {
        console.error('Geocoding error:', err)
      }
    },
    [phase, selectRegion]
  )

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-red-400">
        Maps 로드 실패. API 키를 확인하세요.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
        지도 로딩 중...
      </div>
    )
  }

  return (
    <div className="relative" style={{ height: '45vh' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={MAP_CENTER}
        options={MAP_OPTIONS}
        onClick={handleMapClick}
      >
        <ClearedRegionPolygon clearedRegions={clearedRegions} />
      </GoogleMap>
      {phase === 'IDLE' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
          지도를 클릭하여 나라를 선택하세요
        </div>
      )}
    </div>
  )
}
