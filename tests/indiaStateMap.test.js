import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createIndiaStateIndex, prepareIndiaStateMap, stateContainsLocation } from '../src/lib/indiaStateMap.js'
import { resolutionColor } from '../src/lib/resolutionColor.js'

const boundaries = JSON.parse(fs.readFileSync(new URL('../src/data/indiaStates.json', import.meta.url), 'utf8'))
const index = createIndiaStateIndex(boundaries)
const report = (id, state, status = 'submitted', city = 'Kolkata') => ({ id, status, types: ['pothole', 'debris'], location: { lat: 22.57, lng: 88.36, state, city } })

test('bundled boundaries include all 36 state/UT features and renderable closed rings', () => {
  assert.equal(boundaries.features.length, 36)
  const codes = new Set(boundaries.features.map(feature => feature.properties.code))
  assert.equal(codes.size, 36)
  for (const code of ['IN-LA', 'IN-JK', 'IN-DH', 'IN-TG', 'IN-AN', 'IN-LD']) assert.ok(codes.has(code))
  for (const feature of boundaries.features) {
    assert.equal(feature.geometry.type, 'MultiPolygon')
    assert.ok(feature.geometry.coordinates.length > 0)
    for (const polygon of feature.geometry.coordinates) for (const ring of polygon) {
      assert.ok(ring.length >= 4)
      assert.deepEqual(ring[0], ring.at(-1))
      assert.ok(new Set(ring.map(point => point.join(','))).size >= 3)
      assert.ok(ring.every(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90))
    }
  }
})

test('state shapes count reports once and distinguish no data from zero resolution', () => {
  const result = prepareIndiaStateMap([report('a', 'West Bengal'), report('b', 'west bengal', 'resolved')], index)
  const westBengal = result.states.find(state => state.feature.properties.code === 'IN-WB')
  assert.equal(westBengal.count, 2)
  assert.equal(westBengal.rate, 50)
  assert.equal(westBengal.resolved, 1)
  const empty = result.states.find(state => state.feature.properties.code === 'IN-KA')
  assert.equal(empty.count, 0)
  assert.equal(empty.rate, null)
  const zero = prepareIndiaStateMap([report('a', 'West Bengal')], index).states.find(state => state.feature.properties.code === 'IN-WB')
  assert.equal(zero.rate, 0)
  assert.notEqual(resolutionColor(zero.rate), resolutionColor(westBengal.rate))
})

test('aliases, accents, ISO codes and old territory names match the correct shapes', () => {
  const rows = ['NCT of Delhi', 'New Delhi', 'IN-DL', 'Delhi', 'Daman & Diu', 'Dadra and Nagar Haveli', 'Dādra and Nagar Haveli and Damān and Diu', 'Orissa', 'Pondicherry', 'Mahārāshtra'].map((state, i) => report(i, state))
  const result = prepareIndiaStateMap(rows, index)
  const count = code => result.states.find(state => state.feature.properties.code === code).count
  assert.equal(count('IN-DL'), 4)
  assert.equal(count('IN-DH'), 3)
  assert.equal(count('IN-OR'), 1)
  assert.equal(count('IN-PY'), 1)
  assert.equal(count('IN-MH'), 1)
  assert.equal(result.unmatched, 0)
})

test('coordinates resolve missing state fields without assigning foreign reports to Indian shapes', () => {
  const foreign = { ...report('foreign', 'Punjab'), location: { lat: 31.55, lng: 74.34, state: 'Punjab', country: 'Pakistan' } }
  const outside = { id: 'outside', location: { lat: 51.5, lng: -0.1 } }
  const result = prepareIndiaStateMap([report('kolkata', null), foreign, outside, { id: 'invalid', location: null }], index)
  assert.equal(result.reports.length, 3)
  assert.equal(result.reports[0].location.state, 'West Bengal')
  assert.equal(result.unmatched, 2)
  assert.equal(result.states.reduce((sum, state) => sum + state.count, 0), 1)
  const places = [['IN-DL', 28.61, 77.21], ['IN-KA', 12.97, 77.59], ['IN-MH', 19.076, 72.8777], ['IN-WB', 22.57, 88.36]]
  for (const [code, lat, lng] of places) assert.ok(stateContainsLocation(boundaries.features.find(f => f.properties.code === code), { lat, lng }), code)
})

test('whole-state totals update when date-filtered data changes', () => {
  const rows = [report('a', ' West Bengal ', 'resolved'), report('b', 'IN-WB'), report('c', 'West Bengal', 'submitted', 'Cooch Behar')]
  const result = prepareIndiaStateMap(rows, index)
  const state = result.states.find(item => item.count)
  assert.equal(state.count, 3)
  assert.equal(state.resolved, 1)
  const filtered = prepareIndiaStateMap(rows.slice(0, 1), index).states.find(item => item.count)
  assert.equal(filtered.rate, 100)
  assert.equal(filtered.count, 1)
  assert.equal(rows[0].location.state, ' West Bengal ')
  assert.ok(prepareIndiaStateMap([], index).states.every(item => item.count === 0 && item.rate === null))
})

test('coordinate matching excludes polygon holes and includes detached islands', () => {
  const feature = { bbox: [0, 0, 10, 10], geometry: { type: 'MultiPolygon', coordinates: [
    [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
    [[[8, 8], [10, 8], [10, 10], [8, 10], [8, 8]]],
  ] } }
  assert.equal(stateContainsLocation(feature, { lat: 1.5, lng: 1.5 }), false)
  assert.equal(stateContainsLocation(feature, { lat: 4, lng: 4 }), true)
  assert.equal(stateContainsLocation(feature, { lat: 9, lng: 9 }), true)
})
