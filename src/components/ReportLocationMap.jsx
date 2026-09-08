import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { createPinIcon } from '../lib/mapPin'
import { PICKER_ZOOM } from '../lib/geo'

import { hasValidLocation } from '../lib/reportValidation'
import IndiaMapBounds from './IndiaMapBounds'
import { INDIA_PAN_BOUNDS } from '../lib/indiaMapBounds'

const pinIcon = createPinIcon()

/** Read-only report location with a fixed pin and India-limited map panning. */
export default function ReportLocationMap({ location }) {
  if (!hasValidLocation(location)) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={PICKER_ZOOM}
        maxBounds={INDIA_PAN_BOUNDS}
        maxBoundsViscosity={1}
        inertia={false}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        className="h-56 w-full sm:h-64"
      >
        <IndiaMapBounds />
        <TileLayer
          noWrap
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
