import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { createPinIcon } from '../lib/mapPin'
import { PICKER_ZOOM } from '../lib/geo'

import { hasValidLocation } from '../lib/reportValidation'

const pinIcon = createPinIcon()

/** Read-only map showing exactly where a report was filed -- no click-to-move,
 * no dragging, just the pin, so the report detail view (ReportDetailModal)
 * disambiguates the address text with an actual visual location. */
export default function ReportLocationMap({ location }) {
  if (!hasValidLocation(location)) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={PICKER_ZOOM}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        className="h-56 w-full sm:h-64"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
