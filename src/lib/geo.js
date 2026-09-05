// Small geo helpers used by the map picker and the location filter on the
// community reports feed. No external dependency needed for either.

import { hasValidLocation } from './reportValidation.js'
import { fetchJson } from './request.js'

/** Haversine distance in kilometres between two {lat, lng} points. */
export function distanceKm(a, b) {
  if (!hasValidLocation(a) || !hasValidLocation(b)) return Infinity
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const raw =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const h = Math.min(1, Math.max(0, raw))
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/** Default map center: roughly the centre of India (near Nagpur). */
export const INDIA_CENTER = { lat: 21.1458, lng: 79.0882 }
export const DEFAULT_ZOOM = 5
export const PICKER_ZOOM = 16

export function formatCoords({ lat, lng }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '—'
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

/** Resolve coordinates into the Indian administrative fields used by
 * report forms and location filters. Nominatim varies its field names by
 * region, so each level has conservative fallbacks. */
export async function reverseGeocode(lat, lng) {
  try {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    )
    const address = data.address ?? {}
    return {
      address: data.display_name ?? null,
      state: address.state ?? null,
      district: address.state_district ?? address.county ?? address.district ?? null,
      city:
        address.city ??
        address.town ??
        address.municipality ??
        address.village ??
        address.suburb ??
        null,
    }
  } catch {
    return null
  }
}
