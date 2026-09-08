import { hasValidLocation } from './reportValidation.js'
import { stateContainsLocation } from './indiaStateMap.js'

export const DISTRICT_ZOOM = 6
export const MUNICIPAL_ZOOM = 9
export const WARD_ZOOM = 12
// Street names are already visible here; leave this view clear for report pins.
export const PIN_ZOOM = 14

export function uniqueLocatedReports(reports) {
  const seen = new Set()
  return reports.filter(report => {
    if (!hasValidLocation(report.location) || seen.has(report.id)) return false
    seen.add(report.id)
    return true
  })
}

// Membership never depends on the viewport or on a report's typed city name.
// A shared edge is assigned to the first boundary in the versioned source.
export function aggregateBoundaries(reports, features = []) {
  const regions = features.map(feature => ({ feature, count: 0, resolved: 0, rate: null }))
  const membership = new Map()
  for (const report of uniqueLocatedReports(reports)) {
    const region = regions.find(({ feature }) => stateContainsLocation(feature, report.location))
    if (!region) continue
    membership.set(report.id, region.feature.properties.code)
    if (!region.focus) region.focus = report.location
    region.count++
    if (report.status === 'resolved') region.resolved++
  }
  for (const region of regions) if (region.count) region.rate = region.resolved / region.count * 100
  return { regions, membership }
}

export function intersectsBounds(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

const layer = (region, variant, geometry = region.feature.geometry) => ({ ...region, variant, geometry })

// Parent remnants are pre-clipped at build time. Their statistics still refer
// to the complete parent, so replacing a city never changes a district's rate.
export function boundaryLayersAtZoom({ zoom, states, districts, cities, municipalData, wards }) {
  if (zoom >= PIN_ZOOM) return []
  if (zoom < DISTRICT_ZOOM || !districts) return states.map(region => layer(region, 'state'))
  if (zoom < MUNICIPAL_ZOOM || !municipalData) return districts.map(region => layer(region, 'district'))
  const layers = districts.flatMap(region => {
    const code = region.feature.properties.code
    if (!(code in municipalData.districtMasks)) return [layer(region, 'district')]
    const geometry = municipalData.districtMasks[code]
    return geometry ? [layer(region, 'district-remainder', geometry)] : []
  })
  for (const city of cities) {
    const detail = zoom >= WARD_ZOOM && wards[city.feature.properties.code]
    if (!detail) layers.push(layer(city, 'city'))
    else {
      layers.push(...detail.regions.map(region => layer(region, 'ward')))
      if (detail.remainder) layers.push(layer(city, 'city-remainder', detail.remainder))
    }
  }
  return layers
}

export function heatmapReportsAtZoom({ reports, zoom }) {
  // Missing finer boundaries retain their parent shading, never fallback pins.
  return zoom >= PIN_ZOOM ? reports : []
}
