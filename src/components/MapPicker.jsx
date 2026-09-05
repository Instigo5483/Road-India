import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/useAppContext'
import {
  INDIA_CENTER,
  DEFAULT_ZOOM,
  PICKER_ZOOM,
  formatCoords,
  reverseGeocode,
} from '../lib/geo'
import { createPinIcon } from '../lib/mapPin'
import { IconLocate, IconLoader } from './Icons'

import { hasValidLocation } from '../lib/reportValidation'

const pinIcon = createPinIcon()

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.wrap().lng })
    },
  })
  return null
}

export default function MapPicker({ value, onChange }) {
  const { t } = useLanguage()
  const [locating, setLocating] = useState(false)
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const mapRef = useRef(null)
  const requestId = useRef(0)
  const picked = useRef(hasValidLocation(value))
  useEffect(() => () => { requestId.current += 1 }, [])

  const setLocation = useCallback(
    async (coords) => {
      const id = ++requestId.current
      picked.current = true
      onChange({ ...coords, address: formatCoords(coords), state: null, district: null, city: null })
      setResolvingAddress(true)
      const resolved = await reverseGeocode(coords.lat, coords.lng)
      if (id !== requestId.current) return
      setResolvingAddress(false)
      onChange((prev) => ({
        ...(prev ?? coords),
        ...coords,
        address: resolved?.address ?? formatCoords(coords),
        state: resolved?.state ?? null,
        district: resolved?.district ?? null,
        city: resolved?.city ?? null,
      }))
    },
    [onChange]
  )

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    const id = requestId.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocating(false)
        if (id !== requestId.current) return
        mapRef.current?.flyTo(coords, PICKER_ZOOM, { duration: 0.8 })
        setLocation(coords)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [setLocation])

  useEffect(() => {
    if (!picked.current) handleUseCurrentLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const center = hasValidLocation(value)
    ? [value.lat, value.lng]
    : [INDIA_CENTER.lat, INDIA_CENTER.lng]
  const zoom = hasValidLocation(value) ? PICKER_ZOOM : DEFAULT_ZOOM

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 shadow-card">
      <MapContainer
        center={center}
        zoom={zoom}
        worldCopyJump
        scrollWheelZoom
        className="h-72 w-full sm:h-96"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={setLocation} />
        {hasValidLocation(value) && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng()
                setLocation({ lat: pos.lat, lng: pos.wrap().lng })
              },
            }}
          />
        )}
      </MapContainer>

      <motion.button
        type="button"
        onClick={handleUseCurrentLocation}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-3 right-3 z-[400] flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-brand-800 shadow-card-hover"
      >
        {locating ? (
          <IconLoader className="h-4 w-4" />
        ) : (
          <IconLocate className="h-4 w-4" />
        )}
        {locating
          ? t('report.step2.locating')
          : t('report.step2.useCurrentLocation')}
      </motion.button>

      {resolvingAddress && (
        <div className="absolute left-3 top-3 z-[400] rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-500 shadow-card">
          {t('common.loading')}
        </div>
      )}
    </div>
  )
}
