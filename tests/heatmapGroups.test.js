import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHeatmapHierarchy, heatmapGroupsAtZoom, heatmapCircleRadius, nextHeatmapZoom } from '../src/lib/heatmapGroups.js'
import { distanceKm } from '../src/lib/geo.js'

function report(id, lat, lng, city = 'Kolkata', state = 'West Bengal', status = 'submitted') {
  return { id, status, location: { lat, lng, city, state } }
}

const sample = [
  report('a', 22.57, 88.36, 'Kolkata', 'West Bengal', 'resolved'),
  report('b', 22.5701, 88.3601),
  report('c', 22.65, 88.45),
  report('d', 26.32, 89.45, 'Cooch Behar'),
  report('e', 12.97, 77.59, 'Bengaluru', 'Karnataka', 'resolved'),
]

test('overview groups states, state view uses complete cities, street view reaches locations', () => {
  const tree = buildHeatmapHierarchy(sample)
  assert.equal(heatmapGroupsAtZoom(tree, 4).length, 2)
  const cities = heatmapGroupsAtZoom(tree, 6)
  assert.equal(cities.length, 3)
  const kolkata = cities.find(node => node.place === 'Kolkata')
  assert.equal(kolkata.count, 3)
  assert.equal(kolkata.resolved, 1)
  assert.ok(Math.abs(kolkata.rate - 100 / 3) < 1e-10)
  assert.equal(heatmapGroupsAtZoom(tree, 18).length, 5)
})

test('every split conserves all report memberships and resolved totals through zooming in and out', () => {
  const tree = buildHeatmapHierarchy(sample)
  for (const zoom of [...Array.from({ length: 18 }, (_, i) => i + 1), 12, 9, 6, 4]) {
    const groups = heatmapGroupsAtZoom(tree, zoom)
    assert.deepEqual(groups.flatMap(node => node.reportIds).sort(), sample.map(row => row.id).sort())
    assert.equal(groups.reduce((sum, node) => sum + node.resolved, 0), 2)
  }
  function checkParent(node) {
    if (!node.children.length) return
    assert.deepEqual(node.children.flatMap(child => child.reportIds).sort(), [...node.reportIds].sort())
    assert.equal(node.children.reduce((sum, child) => sum + child.resolved, 0), node.resolved)
    node.children.forEach(checkParent)
  }
  tree.forEach(checkParent)
})

test('whole-place rates use weighted counts even when only a child is visible', () => {
  const rows = [report('closed', 22, 88, 'Small city', 'State', 'resolved'),
    ...Array.from({ length: 9 }, (_, i) => report(`open-${i}`, 26, 89, 'Big city', 'State'))]
  const tree = buildHeatmapHierarchy(rows)
  assert.equal(heatmapGroupsAtZoom(tree, 4)[0].rate, 10)
  const cities = heatmapGroupsAtZoom(tree, 6)
  assert.deepEqual(cities.map(node => node.rate).sort((a, b) => a - b), [0, 100])
  // Simulate viewport culling after aggregation: it cannot change any group's totals.
  assert.equal(cities.filter(node => node.lat < 23)[0].count, 1)
  assert.equal(heatmapGroupsAtZoom(tree, 4)[0].count, 10)
})

test('coincident reports stay together at maximum zoom, nearby distinct locations eventually split', () => {
  const rows = [report('a', 22.57, 88.36), report('b', 22.57, 88.36, 'Kolkata', 'West Bengal', 'resolved'), report('c', 22.5700001, 88.3600001)]
  const groups = heatmapGroupsAtZoom(buildHeatmapHierarchy(rows), 18)
  assert.equal(groups.length, 2)
  assert.equal(groups.find(node => node.count === 2).rate, 50)
  assert.ok(groups.every(node => node.children.length === 0))
})

test('name normalization combines whole cities, but same-named cities in different states stay separate', () => {
  const rows = [report('a', 22, 88, ' Kolkata ', 'West Bengal'), report('b', 23, 89, 'kolkata', 'west bengal'), report('c', 24, 89, 'Kolkata', 'Another state')]
  rows[0].location.country = 'India'
  const cities = heatmapGroupsAtZoom(buildHeatmapHierarchy(rows), 6)
  assert.deepEqual(cities.map(node => node.count).sort(), [1, 2])
})

test('missing place fields and invalid or empty locations are handled without inventing named places', () => {
  const rows = [report('a', 0, 0, null, null), report('b', -33, 151, null, null), { id: 'missing' }, report('bad', 91, 0)]
  const tree = buildHeatmapHierarchy(rows)
  assert.equal(tree.length, 2)
  assert.ok(tree.every(node => node.kind === 'area' && node.place === ''))
  assert.equal(heatmapGroupsAtZoom(tree, 18).length, 2)
  assert.deepEqual(buildHeatmapHierarchy([]), [])
})

test('circle radius covers every member and shrinks on zoom for a single location', () => {
  const rows = [report('west', 10, 179.9, 'Island', 'Islands'), report('east', 10, -179.9, 'Island', 'Islands')]
  const group = buildHeatmapHierarchy(rows)[0]
  assert.ok(group.radius < 15000)
  for (const row of rows) assert.ok(heatmapCircleRadius(group, 6) >= distanceKm(group, row.location) * 1000)
  const leaf = heatmapGroupsAtZoom(buildHeatmapHierarchy([sample[0]]), 18)[0]
  assert.ok(heatmapCircleRadius(leaf, 18) < heatmapCircleRadius(leaf, 10))
  assert.ok(Number.isFinite(heatmapCircleRadius(leaf, 18)))
})

test('zoom action reaches cities first, then skips unchanged sections toward a split or final location', () => {
  const tree = buildHeatmapHierarchy(sample)
  const state = tree.find(node => node.place === 'West Bengal')
  assert.equal(nextHeatmapZoom(state), 6)
  const city = state.children.find(node => node.place === 'Kolkata')
  const zoom = nextHeatmapZoom(city)
  assert.ok(zoom >= 10 && zoom <= 18)
  assert.ok(heatmapGroupsAtZoom([city], zoom).length > 1)
})
