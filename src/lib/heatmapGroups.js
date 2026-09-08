import { hasValidLocation } from './reportValidation.js'
import { distanceKm } from './geo.js'

export const CITY_ZOOM = 6
export const AREA_ZOOM = 10
export const LOCATION_ZOOM = 18

const name = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
const normalized = value => name(value).normalize('NFKC').toLowerCase()
const longitude = lng => ((lng + 180) % 360 + 360) % 360 - 180

// Fixed, nested world cells: changing the viewport never changes membership.
function cellKey(location, zoom) {
  const size = 2 ** zoom
  const lat = Math.max(-85.05112878, Math.min(85.05112878, location.lat)) * Math.PI / 180
  const x = Math.floor((longitude(location.lng) + 180) / 360 * size)
  const y = Math.max(0, Math.min(size - 1, Math.floor((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * size)))
  return `${x}:${y}`
}

const locationKey = location => `${location.lat}:${longitude(location.lng)}`

function partition(rows, keyFor) {
  const groups = new Map()
  for (const row of rows) {
    const key = keyFor(row)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b))
}

function summarize(rows, key, kind, place, minZoom) {
  const locations = rows.map(row => row.location)
  // Unwrap longitudes around a report so a group across the date line stays local.
  const anchor = longitude(locations[0].lng)
  const lngs = locations.map(p => anchor + longitude(p.lng - anchor))
  const lat = (Math.min(...locations.map(p => p.lat)) + Math.max(...locations.map(p => p.lat))) / 2
  const lng = longitude((Math.min(...lngs) + Math.max(...lngs)) / 2)
  const resolved = rows.filter(row => row.status === 'resolved').length
  return {
    key, kind, place, minZoom, lat, lng,
    count: rows.length, resolved, rate: resolved / rows.length * 100,
    radius: Math.max(...locations.map(p => distanceKm({ lat, lng }, p))) * 1000 * 1.08,
    reportIds: rows.map(row => row.id),
    children: [],
  }
}

function spatialGroups(rows, parentKey, place, zoom) {
  const exact = zoom >= LOCATION_ZOOM
  return partition(rows, row => exact ? locationKey(row.location) : cellKey(row.location, zoom)).map(([cell, members]) => {
    const oneLocation = members.every(row => locationKey(row.location) === locationKey(members[0].location))
    const node = summarize(members, `${parentKey}/${zoom}/${cell}`, oneLocation ? 'location' : 'area', place, zoom)
    if (!oneLocation && !exact) node.children = spatialGroups(members, node.key, place, zoom + 1)
    return node
  })
}

/** Build once from the complete date-filtered map data, never visible bounds.
 * Named state/city groups precede nested spatial groups within each city.
 * Missing names use geographic fallbacks rather than one global unknown group. */
export function buildHeatmapHierarchy(reports) {
  const rows = reports.filter(row => hasValidLocation(row.location))
  const countriesByState = new Map()
  const countryName = value => ['in', 'ind', 'india'].includes(normalized(value)) ? 'india' : normalized(value)
  for (const row of rows) {
    const state = normalized(row.location.state)
    const country = countryName(row.location.country)
    if (state && country) {
      if (!countriesByState.has(state)) countriesByState.set(state, new Set())
      countriesByState.get(state).add(country)
    }
  }
  const stateKey = row => {
    const state = normalized(row.location.state)
    const knownCountries = countriesByState.get(state)
    const country = countryName(row.location.country) || (knownCountries?.size === 1 ? [...knownCountries][0] : '')
    const fallback = normalized(row.location.city) || cellKey(row.location, 4)
    return JSON.stringify([country, state || `unknown:${fallback}`])
  }
  return partition(rows, stateKey).map(([key, members]) => {
    const place = name(members[0].location.state)
    const state = summarize(members, key, place ? 'state' : 'area', place, 1)
    state.children = partition(members, row => normalized(row.location.city) || `unknown:${cellKey(row.location, 8)}`).map(([cityKey, cityRows]) => {
      const cityName = name(cityRows[0].location.city)
      const city = summarize(cityRows, `${key}/${JSON.stringify(cityKey)}`, cityName ? 'city' : 'area', cityName || place, CITY_ZOOM)
      city.children = spatialGroups(cityRows, city.key, cityName || place, AREA_ZOOM)
      return city
    })
    return state
  })
}

export function heatmapGroupsAtZoom(hierarchy, zoom) {
  return hierarchy.flatMap(node => node.children.length && zoom >= node.children[0].minZoom
    ? heatmapGroupsAtZoom(node.children, zoom)
    : [node])
}

// Skip levels with a single unchanged group when using “Zoom into area”.
export function nextHeatmapZoom(node) {
  let current = node
  while (current.children.length === 1 && current.kind !== 'state') current = current.children[0]
  if (current.children.length) return current.children[0].minZoom
  return LOCATION_ZOOM
}

export function heatmapCircleRadius(node, zoom) {
  const metersPerPixel = 156543.03392 * Math.cos(node.lat * Math.PI / 180) / 2 ** zoom
  return Math.max(node.radius, metersPerPixel * 9, 3)
}
