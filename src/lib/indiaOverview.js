const EARTH_RADIUS_KM = 6371.0088

// Bounds use the complete bundled geometry, including offshore islands.
// This is an approximate 100 km margin around India's outer bounding box.
export function indiaOverviewBounds(features, marginKm = 100) {
  const west = Math.min(...features.map(feature => feature.bbox[0]))
  const south = Math.min(...features.map(feature => feature.bbox[1]))
  const east = Math.max(...features.map(feature => feature.bbox[2]))
  const north = Math.max(...features.map(feature => feature.bbox[3]))
  const latitudeMargin = marginKm / EARTH_RADIUS_KM * 180 / Math.PI
  const longitudeMargin = latitudeMargin / Math.cos((south + north) / 2 * Math.PI / 180)
  return {
    country: [[south, west], [north, east]],
    pan: [[south - latitudeMargin, west - longitudeMargin], [north + latitudeMargin, east + longitudeMargin]],
  }
}

// Only a container resize may change the scale. Equal min/max zoom also
// blocks keyboard +/- and any accidental programmatic zoom controls.
export function fitIndiaOverview(map, { country, pan }) {
  map.stop()
  map.setMaxBounds(null)
  map.setMinZoom(0)
  map.setMaxZoom(18)
  map.invalidateSize({ pan: false })
  map.fitBounds(country, { padding: [4, 4], animate: false })
  const zoom = map.getZoom()
  map.setMinZoom(zoom)
  map.setMaxZoom(zoom)
  // Wide viewports can exceed the country box even with all India visible.
  // Lock those axes to the fitted view instead of creating inverted drag limits.
  const view = map.getBounds()
  map.setMaxBounds([
    [Math.min(pan[0][0], view.getSouth()), Math.min(pan[0][1], view.getWest())],
    [Math.max(pan[1][0], view.getNorth()), Math.max(pan[1][1], view.getEast())],
  ])
}
