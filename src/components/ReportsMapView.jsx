import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { createPinIcon } from '../lib/mapPin'
import { INDIA_CENTER, DEFAULT_ZOOM } from '../lib/geo'
import ReportDetailModal from './ReportDetailModal'

const pinIcon = createPinIcon()

/** Plain pin-per-report map view for the Ongoing Reports feed -- an
 * alternative to the list, not a true density heatmap (that would need an
 * extra Leaflet plugin; this project deliberately avoids adding bundle
 * weight for it -- see vite.config.js's manualChunks comment). Clicking a
 * pin opens the same shared detail modal every other report view uses. */
export default function ReportsMapView({ reports, user, onUpvote }) {
  const [selected, setSelected] = useState(null)
  const withLocation = reports.filter((r) => r.location?.lat)

  const center = withLocation.length
    ? [withLocation[0].location.lat, withLocation[0].location.lng]
    : [INDIA_CENTER.lat, INDIA_CENTER.lng]
  const zoom = withLocation.length ? 5 : DEFAULT_ZOOM

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-700 shadow-card">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-[28rem] w-full sm:h-[32rem]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withLocation.map((report) => (
          <Marker
            key={report.id}
            position={[report.location.lat, report.location.lng]}
            icon={pinIcon}
            eventHandlers={{ click: () => setSelected(report) }}
          />
        ))}
      </MapContainer>

      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpvote={() => onUpvote(selected.id)}
          upvoted={user ? (selected.upvotedBy ?? []).includes(user.uid) : false}
        />
      )}
    </div>
  )
}
