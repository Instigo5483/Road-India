import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { indiaOverviewBounds, fitIndiaOverview } from '../src/lib/indiaOverview.js'
import { distanceKm } from '../src/lib/geo.js'

const { features } = JSON.parse(fs.readFileSync(new URL('../src/data/indiaStates.json', import.meta.url)))

test('home overview fits every state and offshore island inside a roughly 100 km pan margin', () => {
  const { country: [[south, west], [north, east]], pan: [[minLat, minLng], [maxLat, maxLng]] } = indiaOverviewBounds(features)
  for (const feature of features) {
    const [w, s, e, n] = feature.bbox
    assert.ok(w >= west && s >= south && e <= east && n <= north, feature.properties.name)
  }
  assert.ok(south < 7, 'includes the southern Nicobar islands')
  assert.ok(features.some(feature => feature.properties.code === 'IN-LD'), 'includes Lakshadweep')
  const lat = (south + north) / 2
  const distances = [
    distanceKm({ lat: south, lng: west }, { lat: minLat, lng: west }),
    distanceKm({ lat: north, lng: east }, { lat: maxLat, lng: east }),
    distanceKm({ lat, lng: west }, { lat, lng: minLng }),
    distanceKm({ lat, lng: east }, { lat, lng: maxLng }),
  ]
  for (const distance of distances) assert.ok(Math.abs(distance - 100) < 0.1, `${distance} km`)
})

test('resizing refits the country then locks both zoom limits to the new scale', () => {
  let min = 4, max = 4, zoom = 4, desiredZoom = 3.6
  let invalidations = 0
  const bounds = indiaOverviewBounds(features)
  let dragBounds
  const map = {
    stop() {}, setMaxBounds(value) { dragBounds = value },
    getBounds() { return { getSouth: () => 6, getNorth: () => 38, getWest: () => 55, getEast: () => 110 } },
    setMinZoom(value) { min = value }, setMaxZoom(value) { max = value },
    invalidateSize() { invalidations++ },
    fitBounds(value, options) {
      assert.equal(value, bounds.country)
      assert.equal(options.animate, false)
      zoom = Math.min(max, Math.max(min, desiredZoom))
    },
    getZoom() { return zoom },
  }
  for (const sizeZoom of [3.6, 4.2, 3.1]) {
    desiredZoom = sizeZoom
    fitIndiaOverview(map, bounds)
    assert.equal(zoom, sizeZoom, 'previous fixed zoom must not constrain a resized map')
    assert.equal(min, zoom)
    assert.equal(max, zoom)
    assert.equal(dragBounds[0][1], 55, 'a wide viewport must not get inverted west drag limits')
    assert.equal(dragBounds[1][1], 110, 'a wide viewport must not get inverted east drag limits')
  }
  assert.equal(invalidations, 3)
})
