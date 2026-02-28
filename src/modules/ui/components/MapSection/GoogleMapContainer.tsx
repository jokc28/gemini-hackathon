import { useCallback, useRef, useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { useGameStore } from '../../store/gameStore'
import { ClearedRegionPolygon } from './ClearedRegionPolygon'

const KOREA_CENTER = { lat: 35.9, lng: 127.8 }

const KOREAN_CITIES: { name: string; nameKr: string; lat: number; lng: number }[] = [
  { name: 'Seoul', nameKr: '서울', lat: 37.5665, lng: 126.978 },
  { name: 'Busan', nameKr: '부산', lat: 35.1796, lng: 129.0756 },
  { name: 'Incheon', nameKr: '인천', lat: 37.4563, lng: 126.7052 },
  { name: 'Daegu', nameKr: '대구', lat: 35.8714, lng: 128.6014 },
  { name: 'Daejeon', nameKr: '대전', lat: 36.3504, lng: 127.3845 },
  { name: 'Gwangju', nameKr: '광주', lat: 35.1595, lng: 126.8526 },
  { name: 'Suwon', nameKr: '수원', lat: 37.2636, lng: 127.0286 },
  { name: 'Jeju', nameKr: '제주', lat: 33.4996, lng: 126.5312 },
]

const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 7,
  minZoom: 6,
  maxZoom: 10,
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  restriction: {
    latLngBounds: {
      north: 39.5,
      south: 32.5,
      east: 132,
      west: 124,
    },
    strictBounds: true,
  },
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
    // Hide default labels to reduce clutter
    {
      featureType: 'administrative.locality',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
  ],
}

const LIBRARIES: ('geometry' | 'geocoding' | 'marker')[] = ['marker']

export function GoogleMapContainer() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  const phase = useGameStore((s) => s.phase)
  const clearedRegions = useGameStore((s) => s.clearedRegions)
  const selectRegion = useGameStore((s) => s.selectRegion)

  const mapRef = useRef<google.maps.Map | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleCityClick = useCallback(
    (cityName: string, lat: number, lng: number) => {
      if (phase !== 'IDLE') return

      // Zoom to city
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng })
        mapRef.current.setZoom(9)
      }
      setTimeout(() => selectRegion(cityName), 400)
    },
    [phase, selectRegion]
  )

  if (loadError) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-800 text-red-400">
        Maps 로드 실패. API 키를 확인하세요.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-800 text-gray-400">
        지도 로딩 중...
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={KOREA_CENTER}
        options={MAP_OPTIONS}
        onLoad={handleMapLoad}
      >
        <ClearedRegionPolygon clearedRegions={clearedRegions} />

        {KOREAN_CITIES.map((city) => {
          const isCleared = clearedRegions.includes(city.name)
          return (
            <Marker
              key={city.name}
              position={{ lat: city.lat, lng: city.lng }}
              onClick={() => handleCityClick(city.name, city.lat, city.lng)}
              label={{
                text: `${city.nameKr}`,
                color: isCleared ? '#4ade80' : '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: isCleared ? 12 : 10,
                fillColor: isCleared ? '#22c55e' : '#f59e0b',
                fillOpacity: 1,
                strokeColor: isCleared ? '#86efac' : '#fcd34d',
                strokeWeight: 3,
                labelOrigin: new google.maps.Point(0, -2.5),
              }}
            />
          )
        })}
      </GoogleMap>

      {phase === 'IDLE' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-lg font-semibold px-6 py-3 rounded-full pointer-events-none">
          도시를 선택하여 정복하세요
        </div>
      )}

      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full pointer-events-none animate-pulse">
          {toast}
        </div>
      )}
    </div>
  )
}
