import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { INDIA_COUNTRY_BBOX, INDIA_PAN_BOUNDS, indiaViewportBounds } from '../src/lib/indiaMapBounds.js'
import { indiaOverviewBounds } from '../src/lib/indiaOverview.js'

function projection(zoom) {
  const scale = 256 * 2 ** zoom
  return {
    project: ([lat, lng]) => ({ x: scale * (lng + 180) / 360, y: scale * (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 }),
    unproject: ([x, y]) => ({ lng: x / scale * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI }),
  }
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)

test('every map uses the same 100 km margin as the full home state geometry', () => {
  const { features } = JSON.parse(fs.readFileSync(new URL('../src/data/indiaStates.json', import.meta.url)))
  const { country, pan } = indiaOverviewBounds(features)
  assert.deepEqual(INDIA_COUNTRY_BBOX, [country[0][1], country[0][0], country[1][1], country[1][0]])
  assert.deepEqual(INDIA_PAN_BOUNDS, pan)
})

test('at city and street zoom, dragging stops at the actual buffered bounds', () => {
  for (const zoom of [6, 10, 18]) {
    const { project, unproject } = projection(zoom)
    const bounds = indiaViewportBounds({ x: 1200, y: 500 }, project, unproject)
    bounds.flat().forEach((value, i) => close(value, INDIA_PAN_BOUNDS.flat()[i]))
  }
})

test('zoomed-out screens stay centered on India without inverted drag limits', () => {
  for (const zoom of [1, 3, 4]) {
    const { project, unproject } = projection(zoom)
    const size = { x: 1920, y: 1080 }
    const [[s, w], [n, e]] = indiaViewportBounds(size, project, unproject)
    const nw = project([n, w]), se = project([s, e])
    assert.ok(se.x - nw.x >= size.x - 1e-8)
    assert.ok(se.y - nw.y >= size.y - 1e-8)
    const [[south, west], [north, east]] = INDIA_PAN_BOUNDS
    const originalNW = project([north, west]), originalSE = project([south, east])
    close((nw.x + se.x) / 2, (originalNW.x + originalSE.x) / 2)
    close((nw.y + se.y) / 2, (originalNW.y + originalSE.y) / 2)
  }
})

test('limits shrink back after zooming in or resizing rather than accumulating extra territory', () => {
  const low = projection(1), high = projection(12)
  indiaViewportBounds({ x: 1920, y: 1080 }, low.project, low.unproject)
  const closeUp = indiaViewportBounds({ x: 390, y: 360 }, high.project, high.unproject)
  closeUp.flat().forEach((value, i) => close(value, INDIA_PAN_BOUNDS.flat()[i]))
  const first = indiaViewportBounds({ x: 390, y: 360 }, low.project, low.unproject)
  indiaViewportBounds({ x: 1920, y: 1080 }, low.project, low.unproject)
  assert.deepEqual(indiaViewportBounds({ x: 390, y: 360 }, low.project, low.unproject), first)
})
