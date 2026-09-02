import { useMemo } from 'react'
import { Circle, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import { DEFAULT_ZOOM, INDIA_CENTER } from '../lib/geo'

const HEAT_COLOR = '#dc2626'
const RESOLVED_COLOR = '#16a34a'

/** Aggregates nearby reports into quarter-degree cells so the map communicates
 * density instead of rendering a misleading one-pin-per-report view. */
function makeCells(reports) {
  const cells = new Map()
  reports.forEach((report) => {
    const { lat, lng } = report.location ?? {}
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const key = `${Math.round(lat * 4) / 4}:${Math.round(lng * 4) / 4}`
    const cell = cells.get(key) ?? { lat: 0, lng: 0, count: 0, resolved: 0 }
    cell.lat += lat
    cell.lng += lng
    cell.count += 1
    if (report.status === 'resolved') cell.resolved += 1
    cells.set(key, cell)
  })
  return [...cells.values()].map((cell) => ({
    ...cell,
    lat: cell.lat / cell.count,
    lng: cell.lng / cell.count,
  }))
}

export default function ReportHeatMap({ reports, mode, label, comparisonLabel }) {
  const cells = useMemo(() => makeCells(reports), [reports])
  const center = cells.length ? [cells[0].lat, cells[0].lng] : [INDIA_CENTER.lat, INDIA_CENTER.lng]

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-card">
      <MapContainer
        center={center}
        zoom={cells.length ? 5 : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-[25rem] w-full sm:h-[30rem]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cells.map((cell) => {
          const unresolved = cell.count - cell.resolved
          const compared = mode === 'compare'
          const resolvedDominates = cell.resolved > unresolved
          const balanced = compared && cell.resolved === unresolved
          const color = balanced
            ? '#ca8a04'
            : mode === 'resolved' || (compared && resolvedDominates)
              ? RESOLVED_COLOR
              : HEAT_COLOR
          const lead = compared
            ? Math.abs(cell.resolved - unresolved) / Math.max(cell.count, 1)
            : 1
          const tooltip = compared
            ? comparisonLabel
              .replace('{reports}', unresolved)
              .replace('{resolved}', cell.resolved)
            : label.replace('{count}', cell.count)

          return (
            <Circle
              key={`${cell.lat}-${cell.lng}`}
              center={[cell.lat, cell.lng]}
              radius={Math.min(90000, 14000 + cell.count * 18000)}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: compared
                  ? 0.2 + lead * 0.45
                  : Math.min(0.18 + cell.count * 0.11, 0.65),
                weight: 1,
              }}
            >
              <Tooltip>{tooltip}</Tooltip>
            </Circle>
          )
        })}
      </MapContainer>
    </div>
  )
}
