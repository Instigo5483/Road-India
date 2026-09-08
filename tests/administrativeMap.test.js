import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { aggregateBoundaries, boundaryLayersAtZoom, fallbackReports, uniqueLocatedReports } from '../src/lib/administrativeMap.js'
import { stateContainsLocation } from '../src/lib/indiaStateMap.js'

const data = name => JSON.parse(fs.readFileSync(new URL(`../public/map-boundaries/${name}.json`, import.meta.url), 'utf8'))
const square = (code, west, east, kind = 'district') => ({ type: 'Feature', properties: { code, name: code, kind }, bbox: [west, 0, east, 10], geometry: { type: 'Polygon', coordinates: [[[west, 0], [east, 0], [east, 10], [west, 10], [west, 0]]] } })
const row = (id, lng, status = 'submitted', lat = 5) => ({ id, status, types: ['pothole', 'debris'], location: { lat, lng, city: 'Incorrect typed name' } })

test('coordinate membership counts unique reports, uses resolved/total, and assigns shared edges once', () => {
  const features = [square('a', 0, 5), square('b', 5, 10)]
  const a = row('a', 1, 'resolved')
  const rows = [a, a, row('b', 2), row('edge', 5), row('c', 9), row('outside', 20), { id: 'invalid', location: null }]
  const result = aggregateBoundaries(rows, features)
  assert.equal(result.regions[0].count, 3)
  assert.equal(result.regions[0].resolved, 1)
  assert.ok(Math.abs(result.regions[0].rate - 100 / 3) < 1e-10)
  assert.equal(result.regions[1].count, 1)
  assert.equal(result.membership.get('edge'), 'a')
  assert.equal(result.membership.size, 4)
  assert.equal(uniqueLocatedReports(rows).length, 5)
  assert.equal(aggregateBoundaries([], features).regions[0].rate, null)
  assert.equal(aggregateBoundaries([row('unresolved', 1)], features).regions[0].rate, 0)
  assert.equal(aggregateBoundaries([a], features).regions[0].rate, 100)
})

test('city replacement clips the district fill while retaining its whole-area statistics', () => {
  const rows = [row('resolved', 1, 'resolved'), row('city', 8)]
  const district = aggregateBoundaries(rows, [square('district', 0, 10)])
  const city = aggregateBoundaries(rows, [square('city', 5, 10, 'city')])
  const remainder = square('mask', 0, 5).geometry
  const options = { states: district.regions, districts: district.regions, cities: city.regions,
    municipalData: { districtMasks: { district: remainder } }, wards: {} }
  assert.deepEqual(boundaryLayersAtZoom({ ...options, zoom: 4 }).map(x => x.variant), ['state'])
  assert.deepEqual(boundaryLayersAtZoom({ ...options, zoom: 6 }).map(x => x.variant), ['district'])
  const layers = boundaryLayersAtZoom({ ...options, zoom: 9 })
  assert.deepEqual(layers.map(x => x.variant), ['district-remainder', 'city'])
  assert.equal(layers[0].count, 2)
  assert.equal(layers[0].rate, 50)
  assert.equal(layers[0].geometry, remainder)
  assert.equal(layers[1].rate, 0)
  // Filtering what is drawn on screen must not change the stored rate.
  assert.equal(layers.filter(x => x.variant === 'district-remainder')[0].rate, 50)
  assert.deepEqual(boundaryLayersAtZoom({ ...options, zoom: 9, municipalData: null }).map(x => x.variant), ['district'])
  assert.deepEqual(boundaryLayersAtZoom({ ...options, zoom: 12, districts: null }).map(x => x.variant), ['state'])
})

test('wards replace only their municipality; missing and failed coverage retains parent plus pins', () => {
  const reports = [row('rural', 1), row('ward', 6), row('gap', 9), row('outside', 20)]
  const districts = aggregateBoundaries(reports, [square('district', 0, 10)])
  const cities = aggregateBoundaries(reports, [square('city', 5, 10, 'city')])
  const detail = aggregateBoundaries(reports, [square('ward', 5, 8, 'ward')])
  const wards = { city: { ...detail, remainder: square('gap', 8, 10).geometry } }
  const layers = boundaryLayersAtZoom({ zoom: 12, states: [], districts: districts.regions, cities: cities.regions,
    municipalData: { districtMasks: { district: square('rural', 0, 5).geometry } }, wards })
  assert.deepEqual(layers.map(x => x.variant), ['district-remainder', 'ward', 'city-remainder'])
  const pins = zoom => fallbackReports({ reports, zoom, districts, cities, wards }).map(x => x.id)
  assert.deepEqual(pins(4), [])
  assert.deepEqual(pins(6), ['outside'])
  assert.deepEqual(pins(9), ['rural', 'outside'])
  assert.deepEqual(pins(12), ['rural', 'gap', 'outside'])
  assert.deepEqual(pins(16), reports.map(x => x.id))
  assert.deepEqual(fallbackReports({ reports, zoom: 12, districts, cities, wards: {} }).map(x => x.id), reports.map(x => x.id))
})

test('street zoom hides every boundary, including fallback parents, and zooming out restores them', () => {
  const reports = [row('open', 1), row('done', 2, 'resolved')]
  const regions = aggregateBoundaries(reports, [square('district', 0, 10)]).regions
  const available = { states: regions, districts: regions, cities: [], municipalData: { districtMasks: {} }, wards: {} }
  for (const options of [available, { ...available, districts: null }]) {
    assert.equal(boundaryLayersAtZoom({ ...options, zoom: 13 }).length, 1)
    for (const zoom of [14, 15, 16, 17, 18]) {
      assert.deepEqual(boundaryLayersAtZoom({ ...options, zoom }), [])
      assert.deepEqual(fallbackReports({ reports, zoom }), reports)
    }
    assert.equal(boundaryLayersAtZoom({ ...options, zoom: 13 }).length, 1)
  }
})

test('bundled district and city geometry assigns real locations and keeps municipality totals across wards', () => {
  const districts = data('districts')
  const municipalities = data('municipalities')
  assert.equal(districts.features.length, 735)
  assert.equal(municipalities.features.length, 7)
  const locations = [row('bengaluru', 77.59, 'resolved', 12.97), row('kolkata', 88.36, 'submitted', 22.57),
    row('chennai', 80.27, 'resolved', 13.08), row('mumbai', 72.84, 'submitted', 19.06)]
  const districtStats = aggregateBoundaries(locations, districts.features)
  const cities = aggregateBoundaries(locations, municipalities.features)
  assert.equal(districtStats.membership.size, locations.length)
  for (const report of locations) {
    assert.equal(cities.membership.get(report.id), report.id)
    const wards = data(report.id)
    const stats = aggregateBoundaries([report], wards.features)
    assert.equal(stats.membership.size, 1, report.id)
    assert.equal(stats.regions.reduce((sum, r) => sum + r.count, 0), 1)
    // A municipality must never have a parent district fill behind its report.
    for (const district of districts.features) {
      const geometry = municipalities.districtMasks[district.properties.code]
      const drawn = district.properties.code in municipalities.districtMasks ? geometry : district.geometry
      if (drawn) assert.equal(stateContainsLocation({ ...district, geometry: drawn }, report.location), false, report.id)
    }
  }
})

test('all versioned geometry has unique IDs, closed valid coordinates and a documented source', () => {
  for (const name of ['districts', 'municipalities', 'bengaluru', 'kolkata', 'chennai', 'delhi', 'mumbai', 'hyderabad', 'jaipur']) {
    const collection = data(name)
    const codes = collection.features.map(f => f.properties.code)
    assert.equal(new Set(codes).size, codes.length, name)
    for (const feature of collection.features) {
      assert.ok(feature.properties.source)
      assert.ok(feature.properties.vintage)
      const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
      assert.ok(polygons.length)
      for (const polygon of polygons) for (const ring of polygon) {
        assert.ok(ring.length >= 4)
        assert.deepEqual(ring[0], ring.at(-1))
        assert.ok(ring.every(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat) && lng >= 60 && lng <= 100 && lat >= 0 && lat <= 40), name)
      }
    }
  }
})
