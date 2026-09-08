import { hasValidLocation } from './reportValidation.js'

const normalize = value => typeof value === 'string'
  ? value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  : ''

export function createIndiaStateIndex(collection) {
  const byName = new Map()
  for (const feature of collection.features) {
    byName.set(normalize(feature.properties.name), feature)
    byName.set(normalize(feature.properties.code), feature)
  }
  const aliases = {
    'New Delhi': 'IN-DL', 'NCT of Delhi': 'IN-DL', 'Delhi NCT': 'IN-DL',
    'National Capital Territory of Delhi': 'IN-DL',
    Orissa: 'IN-OR', Uttaranchal: 'IN-UT', Pondicherry: 'IN-PY',
    'Andaman and Nicobar': 'IN-AN', 'J&K': 'IN-JK',
    'Dadra and Nagar Haveli': 'IN-DH', 'Daman and Diu': 'IN-DH',
  }
  for (const [alias, code] of Object.entries(aliases)) byName.set(normalize(alias), byName.get(normalize(code)))
  return { features: collection.features, byName }
}

function inRing(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    // Include shared edges; the caller deterministically picks one feature.
    const cross = (lng - xi) * (yj - yi) - (lat - yi) * (xj - xi)
    if (Math.abs(cross) < 1e-12 && lng >= Math.min(xi, xj) && lng <= Math.max(xi, xj) && lat >= Math.min(yi, yj) && lat <= Math.max(yi, yj)) return true
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function stateContainsLocation(feature, { lat, lng }) {
  const [west, south, east, north] = feature.bbox
  if (lng < west || lng > east || lat < south || lat > north) return false
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  return polygons.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some(hole => inRing(lng, lat, hole)))
}

export function prepareIndiaStateMap(reports, index) {
  const states = index.features.map(feature => ({ feature, count: 0, resolved: 0, rate: null }))
  const byCode = new Map(states.map(state => [state.feature.properties.code, state]))
  let unmatched = 0
  const mappedReports = reports.filter(report => hasValidLocation(report.location)).map(report => {
    const country = normalize(report.location.country)
    const isIndia = !country || ['india', 'in', 'ind', 'bharat', 'भारत'].includes(country)
    const feature = isIndia && (index.byName.get(normalize(report.location.state))
      || index.features.find(candidate => stateContainsLocation(candidate, report.location)))
    if (!feature) { unmatched++; return report }
    const state = byCode.get(feature.properties.code)
    state.count++
    if (report.status === 'resolved') state.resolved++
    // Preserve canonical state names for callers using this state snapshot.
    return { ...report, location: { ...report.location, country: 'India', state: feature.properties.name } }
  })
  for (const state of states) if (state.count) state.rate = state.resolved / state.count * 100
  return { reports: mappedReports, states, unmatched }
}
