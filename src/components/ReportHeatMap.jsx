import { useEffect, useMemo, useState } from 'react'
import { Circle, GeoJSON, MapContainer, TileLayer, Tooltip, Popup, Marker, useMap, useMapEvents } from 'react-leaflet'
import { createPinIcon } from '../lib/mapPin'
import ReportDetailModal from './LazyReportDetailModal'
import { useLanguage } from '../context/useAppContext'

import { hasValidLocation } from '../lib/reportValidation'
import { resolutionColor } from '../lib/resolutionColor'
import { CITY_ZOOM, buildHeatmapHierarchy, heatmapGroupsAtZoom, heatmapCircleRadius, nextHeatmapZoom } from '../lib/heatmapGroups'
import indiaStates from '../data/indiaStates.json'
import { createIndiaStateIndex, prepareIndiaStateMap } from '../lib/indiaStateMap'

const pinIcon = createPinIcon()
const stateIndex = createIndiaStateIndex(indiaStates)
const stateAttribution = 'States: <a href="https://www.geoboundaries.org/">geoBoundaries</a> / <a href="https://github.com/datameet/maps">DataMeet</a> (<a href="https://creativecommons.org/licenses/by/2.5/in/">CC BY 2.5 IN</a>)'

// Keep report-only views translucent alongside the resolution gradient.
const HEAT_COLOR = '#fca5a5'
const RESOLVED_COLOR = '#86efac'

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

function resolutionDetails(rate, count, resolved, comparisonLabel, lang) {
  return comparisonLabel
    .replace('{rate}', (rate < 50 ? Math.min(rate, 49.99) : rate).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { maximumFractionDigits: 2 }))
    .replace('{total}', count)
    .replace('{resolved}', resolved)
}

function StateHeatShapes({ states, mode, label, comparisonLabel, mapWidth }) {
  const { t, lang } = useLanguage()
  const map = useMap()
  return states.map(({ feature, count, resolved, rate }) => {
    const compared = mode === 'compare'
    const color = !count ? '#94a3b8' : compared ? resolutionColor(rate) : mode === 'resolved' ? RESOLVED_COLOR : HEAT_COLOR
    const details = !count ? t('data.heat.noStateReports') : compared
      ? resolutionDetails(rate, count, resolved, comparisonLabel, lang)
      : label.replace('{count}', count)
    const zoomIntoState = () => {
      const [west, south, east, north] = feature.bbox
      const bounds = [[south, west], [north, east]]
      const zoom = Math.max(CITY_ZOOM, Math.min(9, map.getBoundsZoom(bounds, false, [48, 120])))
      map.closePopup()
      map.setView([(south + north) / 2, (west + east) / 2], zoom)
    }
    return <GeoJSON key={`${mode}:${feature.properties.code}`} data={feature} attribution={stateAttribution}
      style={{ color, fillColor: color, fillOpacity: count ? 0.25 : 0, opacity: 0.5, weight: 1 }}>
      <Tooltip><strong>{feature.properties.name}</strong><br />{details}</Tooltip>
      <Popup key={mapWidth} maxWidth={Math.max(100, Math.min(260, mapWidth - 72))} autoPanPaddingTopLeft={[12, 60]} autoPanPaddingBottomRight={[12, 12]}>
        <strong>{feature.properties.name}</strong><br />{details}
        {count > 0 && compared && <p className="!my-2 text-xs text-ink-500">{t('data.heat.wholePlace')}</p>}
        <button type="button" onClick={zoomIntoState} className="mt-2 min-h-10 rounded-lg bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700">{t('data.heat.zoomIntoState')}</button>
      </Popup>
    </GeoJSON>
  })
}

function GroupedHeatLayer({ reports, mode, label, comparisonLabel }) {
  const { t, lang } = useLanguage()
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const [mapWidth, setMapWidth] = useState(() => map.getSize().x)
  useMapEvents({ zoomend: () => setZoom(map.getZoom()), resize: () => setMapWidth(map.getSize().x) })
  const stateData = useMemo(() => prepareIndiaStateMap(reports, stateIndex), [reports])
  const hierarchy = useMemo(() => buildHeatmapHierarchy(stateData.reports), [stateData])
  const groups = useMemo(() => heatmapGroupsAtZoom(hierarchy, zoom), [hierarchy, zoom])

  if (zoom < CITY_ZOOM) return <>
    <StateHeatShapes states={stateData.states} mode={mode} label={label} comparisonLabel={comparisonLabel} mapWidth={mapWidth} />
    {stateData.unmatched > 0 && <div role="status" className="absolute bottom-12 left-3 right-3 z-[500] rounded bg-white/95 px-2 py-1 text-xs text-ink-600">{t('data.heat.unmatchedStates', { count: stateData.unmatched })}</div>}
  </>

  return groups.map(group => {
    const compared = mode === 'compare'
    const color = compared ? resolutionColor(group.rate) : mode === 'resolved' ? RESOLVED_COLOR : HEAT_COLOR
    const place = group.kind === 'state' || group.kind === 'city'
      ? group.place
      : group.place ? t('data.heat.areaIn', { place: group.place }) : t('data.heat.localArea')
    const details = compared
      ? resolutionDetails(group.rate, group.count, group.resolved, comparisonLabel, lang)
      : label.replace('{count}', group.count)
    const zoomInto = () => {
      map.closePopup()
      map.setView([group.lat, group.lng], Math.min(map.getMaxZoom(), Math.max(zoom + 1, nextHeatmapZoom(group))))
    }
    return <Circle
      key={`${mode}:${group.key}`}
      center={[group.lat, group.lng]}
      radius={heatmapCircleRadius(group, zoom)}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.25, opacity: 0.5, weight: 1 }}
      eventHandlers={{ click: event => event.target.closeTooltip() }}
    >
      <Tooltip><strong>{place}</strong><br />{details}</Tooltip>
      <Popup key={mapWidth} maxWidth={Math.max(100, Math.min(260, mapWidth - 72))} autoPanPaddingTopLeft={[12, 60]} autoPanPaddingBottomRight={[12, 12]}>
        <strong>{place}</strong><br />
        {details}
        {(group.kind === 'area' || group.kind === 'location') && <div className="mt-1 text-xs text-ink-500">{group.lat.toFixed(5)}, {group.lng.toFixed(5)}</div>}
        {compared && <p className="!my-2 text-xs text-ink-500">{t('data.heat.wholePlace')}</p>}
        {zoom < map.getMaxZoom() && <button type="button" onClick={zoomInto} className="mt-2 min-h-10 rounded-lg bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700">{t('data.heat.zoomInto')}</button>}
      </Popup>
    </Circle>
  })
}

export default function ReportHeatMap({ reports, mode, label, comparisonLabel, displayMode = 'heatmap' }) {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = useState(null)
  const locatedReports = useMemo(() => reports.filter(report => hasValidLocation(report.location)), [reports])
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
        {displayMode !== 'pins' && <GroupedHeatLayer reports={locatedReports} mode={mode} label={label} comparisonLabel={comparisonLabel} />}
        {displayMode !== 'heatmap' && <VisiblePins reports={locatedReports} onSelect={setSelectedId} />}
      </MapContainer>
    </div>
    {!locatedReports.length && <p role="status" className="mt-2 text-xs text-ink-500">{t('data.map.empty')}</p>}
    {selected && <ReportDetailModal report={selected} onClose={() => setSelectedId(null)} showUpvote={false} />}
    </div>
  )
}
