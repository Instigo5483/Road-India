import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, TileLayer, Tooltip, Marker, useMap, useMapEvents } from 'react-leaflet'
import { createPinIcon } from '../lib/mapPin'
import ReportDetailModal from './LazyReportDetailModal'
import { useLanguage } from '../context/useAppContext'

import { hasValidLocation } from '../lib/reportValidation'

const pinIcon = createPinIcon()

const HEAT_COLOR = '#dc2626'
const RESOLVED_COLOR = '#16a34a'

function ResizeMap() {
  const map = useMap()
  const { t } = useLanguage()
  useEffect(() => {
    const resize = () => {
      map.invalidateSize()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return <button type="button" onClick={() => map.setView([22, 82], 4)} className="absolute right-3 top-3 z-[1000] min-h-10 rounded-lg border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-700 shadow">{t('data.map.reset')}</button>
}

function VisiblePins({ reports, onSelect }) {
  const map = useMap()
  const [bounds, setBounds] = useState(() => map.getBounds())
  useMapEvents({ moveend: () => setBounds(map.getBounds()), resize: () => setBounds(map.getBounds()) })
  return reports.filter(r => bounds.contains([r.location.lat, r.location.lng])).map(report => <Marker key={report.id} position={[report.location.lat, report.location.lng]} icon={pinIcon} title={`#${report.id}`} eventHandlers={{ click: () => onSelect(report.id) }}><Tooltip>#{report.id} · {report.description}</Tooltip></Marker>)
}

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

export default function ReportHeatMap({ reports, mode, label, comparisonLabel, displayMode = 'heatmap' }) {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = useState(null)
  const locatedReports = useMemo(() => reports.filter(report => hasValidLocation(report.location)), [reports])
  const cells = useMemo(() => makeCells(locatedReports), [locatedReports])
  const selected = locatedReports.find(r => r.id === selectedId)

  return (
    <div>
    <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-card">
      <MapContainer
        center={[22, 82]}
        zoom={4}
        minZoom={1}
        worldCopyJump
        maxZoom={18}
        preferCanvas
        scrollWheelZoom
        className="h-80 w-full sm:h-96"
      >
        <ResizeMap />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          keepBuffer={1}
          updateWhenIdle
        />
        {displayMode !== 'pins' && cells.map((cell) => {
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
        {displayMode !== 'heatmap' && <VisiblePins reports={locatedReports} onSelect={setSelectedId} />}
      </MapContainer>
    </div>
    {!locatedReports.length && <p role="status" className="mt-2 text-xs text-ink-500">{t('data.map.empty')}</p>}
    {selected && <ReportDetailModal report={selected} onClose={() => setSelectedId(null)} showUpvote={false} />}
    </div>
  )
}
