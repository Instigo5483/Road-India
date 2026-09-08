import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, Tooltip, Popup, Marker, useMap, useMapEvents } from 'react-leaflet'
import { createPinIcon, createReportPinIcon } from '../lib/mapPin'
import ReportDetailModal from './LazyReportDetailModal'
import { useLanguage } from '../context/useAppContext'

import { resolutionColor } from '../lib/resolutionColor'
import { DISTRICT_ZOOM, MUNICIPAL_ZOOM, WARD_ZOOM, PIN_ZOOM, uniqueLocatedReports, aggregateBoundaries, boundaryLayersAtZoom, heatmapReportsAtZoom, intersectsBounds } from '../lib/administrativeMap'
import { loadBoundaryAsset } from '../lib/boundaryAssets'
import { guardPinsDuringZoom } from '../lib/pinZoomVisibility'
import indiaStates from '../data/indiaStates.json'
import { createIndiaStateIndex, prepareIndiaStateMap } from '../lib/indiaStateMap'
import IndiaMapBounds from './IndiaMapBounds'
import { INDIA_PAN_BOUNDS } from '../lib/indiaMapBounds'

const pinIcon = createPinIcon()
const unresolvedPinIcon = createReportPinIcon(false)
const resolvedPinIcon = createReportPinIcon(true)
const stateIndex = createIndiaStateIndex(indiaStates)
const stateAttribution = 'States: <a href="https://www.geoboundaries.org/">geoBoundaries</a> / <a href="https://github.com/datameet/maps">DataMeet</a> (<a href="https://creativecommons.org/licenses/by/2.5/in/">CC BY 2.5 IN</a>)'
const districtAttribution = 'Districts: <a href="https://www.geoboundaries.org/">geoBoundaries</a> (<a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>)'
const cityAttribution = 'Municipal: <a href="https://github.com/datameet/Municipal_Spatial_Data">DataMeet</a> (<a href="https://creativecommons.org/licenses/by-sa/2.5/in/">CC BY-SA 2.5 IN</a>)'
const osmAttribution = 'Hyderabad: OpenStreetMap (<a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>)'

// Keep report-only views translucent alongside the resolution gradient.
const HEAT_COLOR = '#fca5a5'
const RESOLVED_COLOR = '#86efac'

function ResizeMap({ displayMode }) {
  const map = useMap()
  const { t } = useLanguage()
  useEffect(() => guardPinsDuringZoom(map, displayMode === 'heatmap' ? PIN_ZOOM : 0), [map, displayMode])
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

function VisiblePins({ reports, onSelect, streetOnly = false }) {
  const map = useMap()
  const { t } = useLanguage()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const [bounds, setBounds] = useState(() => map.getBounds())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()), moveend: () => setBounds(map.getBounds()), resize: () => setBounds(map.getBounds()) })
  const visibleReports = streetOnly ? heatmapReportsAtZoom({ reports, zoom }) : reports
  return visibleReports.filter(r => bounds.contains([r.location.lat, r.location.lng])).map(report => {
    const streetLevel = zoom >= PIN_ZOOM
    const resolved = report.status === 'resolved'
    const status = t(resolved ? 'data.map.pinResolved' : 'data.map.pinUnresolved')
    const title = `#${report.id}${streetLevel ? ` · ${status}` : ''}`
    return <Marker key={report.id} position={[report.location.lat, report.location.lng]} icon={streetLevel ? resolved ? resolvedPinIcon : unresolvedPinIcon : pinIcon} title={title} alt={title} eventHandlers={{ click: () => onSelect(report.id) }}><Tooltip>{title} · {report.description}</Tooltip></Marker>
  })
}

function resolutionDetails(rate, count, resolved, comparisonLabel, lang) {
  return comparisonLabel
    .replace('{rate}', (rate < 50 ? Math.min(rate, 49.99) : rate).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { maximumFractionDigits: 2 }))
    .replace('{total}', count)
    .replace('{resolved}', resolved)
}

function BoundaryHeatShapes({ regions, mode, label, comparisonLabel, mapWidth, zoom }) {
  const { t, lang } = useLanguage()
  const map = useMap()
  return regions.map(({ feature, geometry, variant, count, resolved, rate, focus }) => {
    const kind = feature.properties.kind || 'state'
    const compared = mode === 'compare'
    const color = !count ? '#94a3b8' : compared ? resolutionColor(rate) : mode === 'resolved' ? RESOLVED_COLOR : HEAT_COLOR
    const details = !count ? t('data.heat.noRegionReports') : compared
      ? resolutionDetails(rate, count, resolved, comparisonLabel, lang)
      : label.replace('{count}', count)
    const zoomInto = () => {
      const [west, south, east, north] = feature.bbox
      const bounds = [[south, west], [north, east]]
      const nextZoom = kind === 'state' ? DISTRICT_ZOOM : kind === 'district' ? MUNICIPAL_ZOOM : kind === 'city' ? WARD_ZOOM : PIN_ZOOM
      const targetZoom = Math.min(18, Math.max(zoom + 1, nextZoom, Math.min(nextZoom + 1, map.getBoundsZoom(bounds, false, [48, 120]))))
      map.closePopup()
      const center = kind === 'ward' && focus ? [focus.lat, focus.lng] : [(south + north) / 2, (west + east) / 2]
      map.setView(center, targetZoom)
    }
    const attribution = kind === 'state' ? stateAttribution : kind === 'district' ? districtAttribution : feature.properties.source === 'osm' ? osmAttribution : cityAttribution
    return <GeoJSON key={`${mode}:${variant}:${feature.properties.code}`} data={{ ...feature, geometry }} attribution={attribution}
      style={{ color, fillColor: color, fillOpacity: count ? 0.25 : 0, opacity: 0.5, weight: 1 }}>
      <Tooltip><strong>{feature.properties.name}</strong><br />{details}</Tooltip>
      <Popup key={mapWidth} maxHeight={180} maxWidth={Math.max(100, Math.min(260, mapWidth - 72))} autoPanPaddingTopLeft={[12, 60]} autoPanPaddingBottomRight={[12, 12]}>
        <strong>{feature.properties.name}</strong><br />{details}
        <div className="mt-1 text-xs text-ink-500">{t('data.heat.level.' + kind)}</div>
        {zoom < 18 && <button type="button" onClick={zoomInto} className="mt-2 min-h-10 rounded-lg bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700">{t('data.heat.zoomInto')}</button>}
        {count > 0 && compared && <p className="!my-2 text-xs text-ink-500">{t('data.heat.wholePlace')}</p>}
        {variant.endsWith('remainder') && <p className="!my-2 text-xs text-ink-500">{t('data.heat.parentRemainder')}</p>}
        {feature.properties.extent === 'wards' && <p className="!my-2 text-xs text-ink-500">{t('data.heat.mappedExtent')}</p>}
        {feature.properties.vintage && <p className="!my-2 text-xs text-ink-500">{feature.properties.vintage === 'undated' ? t('data.heat.undated') : t('data.heat.snapshot', { year: feature.properties.vintage })}</p>}
      </Popup>
    </GeoJSON>
  })
}

function useBoundaryAssets(zoom, bounds) {
  const [assets, setAssets] = useState({})
  const [failed, setFailed] = useState({})
  const [attempt, setAttempt] = useState(0)
  const wanted = []
  if (zoom >= DISTRICT_ZOOM && zoom < PIN_ZOOM) wanted.push('districts')
  if (zoom >= MUNICIPAL_ZOOM && zoom < PIN_ZOOM) wanted.push('municipalities')
  if (zoom >= WARD_ZOOM && zoom < PIN_ZOOM) for (const city of assets.municipalities?.features || []) {
    if (intersectsBounds(city.bbox, bounds)) wanted.push(city.properties.code)
  }
  const key = wanted.sort().join('|')
  useEffect(() => {
    let active = true
    for (const name of key ? key.split('|') : []) {
      loadBoundaryAsset(name).then(data => {
        if (active) {
          setAssets(current => ({ ...current, [name]: data }))
          setFailed(current => ({ ...current, [name]: false }))
        }
      }).catch(() => { if (active) setFailed(current => ({ ...current, [name]: true })) })
    }
    return () => { active = false }
  }, [key, attempt])
  return {
    assets, loading: wanted.some(name => !assets[name] && !failed[name]),
    error: wanted.some(name => failed[name]),
    retry: () => { setFailed({}); setAttempt(value => value + 1) },
  }
}

const viewBounds = map => {
  const bounds = map.getBounds()
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
}

function GroupedHeatLayer({ reports, mode, label, comparisonLabel }) {
  const { t } = useLanguage()
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const [mapWidth, setMapWidth] = useState(() => map.getSize().x)
  const [bounds, setBounds] = useState(() => viewBounds(map))
  useMapEvents({ zoomend: () => setZoom(map.getZoom()), moveend: () => setBounds(viewBounds(map)), resize: () => { setMapWidth(map.getSize().x); setBounds(viewBounds(map)) } })
  const { assets, loading, error, retry } = useBoundaryAssets(zoom, bounds)
  const stateData = useMemo(() => prepareIndiaStateMap(reports, stateIndex), [reports])
  const districts = useMemo(() => assets.districts && aggregateBoundaries(reports, assets.districts.features), [reports, assets.districts])
  const cities = useMemo(() => assets.municipalities && aggregateBoundaries(reports, assets.municipalities.features), [reports, assets.municipalities])
  const wards = useMemo(() => Object.fromEntries(Object.entries(assets).filter(([name]) => !['districts', 'municipalities'].includes(name))
    .map(([name, data]) => [name, { ...aggregateBoundaries(reports, data.features), remainder: data.remainder }])), [reports, assets])
  const regions = boundaryLayersAtZoom({ zoom, states: stateData.states, districts: districts?.regions, cities: cities?.regions,
    municipalData: assets.municipalities, wards }).filter(region => intersectsBounds(region.feature.bbox, bounds))
  return <>
    {zoom < PIN_ZOOM && <BoundaryHeatShapes regions={regions} mode={mode} label={label} comparisonLabel={comparisonLabel} mapWidth={mapWidth} zoom={zoom} />}
    {(loading || error || (zoom < DISTRICT_ZOOM && stateData.unmatched > 0)) && <div role="status" className="absolute bottom-12 left-3 right-3 z-[500] rounded bg-white/95 px-2 py-1 text-xs text-ink-600">
      {error ? <>{t('data.heat.loadError')} <button type="button" onClick={retry} className="min-h-10 px-2 font-semibold text-accent-700">{t('data.heat.retry')}</button></>
        : loading ? t('data.heat.loading') : t('data.heat.unmatchedStates', { count: stateData.unmatched })}
    </div>}
  </>
}

export default function ReportHeatMap({ reports, mode, label, comparisonLabel, displayMode = 'heatmap' }) {
  const { t } = useLanguage()
  const [selectedId, setSelectedId] = useState(null)
  const locatedReports = useMemo(() => uniqueLocatedReports(reports), [reports])
  const selected = locatedReports.find(r => r.id === selectedId)

  return (
    <div>
    <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-card">
      <MapContainer
        center={[22, 82]}
        zoom={4}
        minZoom={1}
        maxBounds={INDIA_PAN_BOUNDS}
        maxBoundsViscosity={1}
        inertia={false}
        maxZoom={18}
        preferCanvas
        markerZoomAnimation={false}
        scrollWheelZoom
        className="h-80 w-full sm:h-96"
      >
        <IndiaMapBounds />
        <ResizeMap displayMode={displayMode} />
        <TileLayer
          noWrap
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          keepBuffer={1}
          updateWhenIdle
        />
        {displayMode !== 'pins' && <GroupedHeatLayer reports={locatedReports} mode={mode} label={label} comparisonLabel={comparisonLabel} />}
        <VisiblePins reports={locatedReports} onSelect={setSelectedId} streetOnly={displayMode === 'heatmap'} />
      </MapContainer>
    </div>
    {!locatedReports.length && <p role="status" className="mt-2 text-xs text-ink-500">{t('data.map.empty')}</p>}
    <p className="mt-2 text-[11px] leading-relaxed text-ink-500">{t('data.map.streetPins')}</p>
    {displayMode !== 'pins' && <details className="mt-2 text-[11px] leading-relaxed text-ink-500">
      <summary className="cursor-pointer py-1 font-semibold">{t('data.heat.coverageTitle')}</summary>
      <p>{t('data.heat.coverage')}</p>
      <a href={`${import.meta.env.BASE_URL}map-boundaries/SOURCES.md`} target="_blank" rel="noreferrer" className="underline">{t('data.heat.sources')}</a>
    </details>}
    {selected && <ReportDetailModal report={selected} onClose={() => setSelectedId(null)} showUpvote={false} />}
    </div>
  )
}
