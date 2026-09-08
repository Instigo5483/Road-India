import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../context/useAppContext'
import indiaStates from '../data/indiaStates.json'
import { createIndiaStateIndex, prepareIndiaStateMap } from '../lib/indiaStateMap'
import { indiaOverviewBounds, fitIndiaOverview } from '../lib/indiaOverview'
import { uniqueLocatedReports } from '../lib/administrativeMap'
import { normalizeCategoryId } from '../data/categoryTypes'
import { resolutionColor } from '../lib/resolutionColor'

const stateIndex = createIndiaStateIndex(indiaStates)
const bounds = indiaOverviewBounds(indiaStates.features)

function FitOverview() {
  const map = useMap()
  useEffect(() => {
    let lastSize = ''
    const fit = () => {
      const container = map.getContainer()
      if (!container.clientWidth || !container.clientHeight) return
      const size = `${container.clientWidth}:${container.clientHeight}`
      if (size === lastSize) return
      lastSize = size
      fitIndiaOverview(map, bounds)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function HomeIndiaMap({ reports }) {
  const { t, lang } = useLanguage()
  const [selectedCode, setSelectedCode] = useState(null)
  const { states, unmatched } = useMemo(() => prepareIndiaStateMap(
    uniqueLocatedReports(reports.filter(report => normalizeCategoryId(report.category) === 'issue')), stateIndex,
  ), [reports])
  const detailsFor = ({ count, resolved, rate }) => count ? t('data.heat.comparisonTooltip', {
    rate: (rate < 50 ? Math.min(rate, 49.99) : rate).toLocaleString(lang, { maximumFractionDigits: 2 }),
    total: count.toLocaleString(lang), resolved: resolved.toLocaleString(lang),
  }) : t('home.map.noReports')
  const selected = states.find(state => state.feature.properties.code === selectedCode)

  return <>
    <MapContainer bounds={bounds.country} boundsOptions={{ padding: [4, 4] }}
      maxBounds={bounds.pan} maxBoundsViscosity={1} zoomSnap={0}
      attributionControl={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false}
      touchZoom={false} boxZoom={false} dragging inertia={false} trackResize={false}
      className="home-india-map" aria-label={t('home.map.label')}>
      <FitOverview />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap keepBuffer={1} updateWhenIdle />
      {states.map(state => {
        const { feature, count, rate } = state
        const color = count ? resolutionColor(rate) : '#94a3b8'
        return <GeoJSON key={feature.properties.code} data={feature}
          eventHandlers={{ click: () => setSelectedCode(feature.properties.code) }}
          style={{ color, fillColor: color, fillOpacity: count ? 0.25 : 0, opacity: 0.5, weight: selectedCode === feature.properties.code ? 2 : 1 }} />
      })}
    </MapContainer>
    <div className="home-map-attribution">
      <a href="https://leafletjs.com/">Leaflet</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.geoboundaries.org/">geoBoundaries</a> / <a href="https://github.com/datameet/maps">DataMeet</a> (<a href="https://creativecommons.org/licenses/by/2.5/in/">CC BY 2.5 IN</a>)
    </div>
    {selected && <div className="home-map-selection" role="status">
      <div><strong>{selected.feature.properties.name}</strong><p>{detailsFor(selected)}</p></div>
      <button type="button" onClick={() => setSelectedCode(null)} aria-label={t('common.close')}>×</button>
    </div>}
    {unmatched > 0 && <p className="home-map-status" role="status">{t('data.heat.unmatchedStates', { count: unmatched })}</p>}
  </>
}
