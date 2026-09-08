import fs from 'node:fs'

// Input: geoBoundaries IND ADM1 simplified GeoJSON, pinned in the source note.
// Further generalize for overview zooms only; retain small islands and holes.
const source = JSON.parse(fs.readFileSync(process.argv[2] || 'tmp/india-states-source.geojson', 'utf8'))
const tolerance = 0.01

function segmentDistanceSquared(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const length = dx * dx + dy * dy
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0
  return (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2
}

function simplify(points) {
  const keep = new Set([0, points.length - 1])
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    let best = tolerance ** 2, selected = -1
    for (let i = start + 1; i < end; i++) {
      const distance = segmentDistanceSquared(points[i], points[start], points[end])
      if (distance > best) { best = distance; selected = i }
    }
    if (selected !== -1) {
      keep.add(selected)
      stack.push([start, selected], [selected, end])
    }
  }
  return [...keep].sort((a, b) => a - b).map(i => points[i])
}

function ring(points) {
  const simplified = simplify(points)
  const kept = simplified.length >= 4 ? simplified : points
  return kept.map(point => point.map(value => Number(value.toFixed(5))))
}

const features = source.features.map(feature => {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const all = polygons.flat(2)
  const bbox = [Math.min(...all.map(p => p[0])), Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[0])), Math.max(...all.map(p => p[1]))]
  return {
    type: 'Feature',
    properties: { name: feature.properties.shapeName.normalize('NFD').replace(/\p{M}/gu, ''), code: feature.properties.shapeISO },
    bbox,
    geometry: { type: 'MultiPolygon', coordinates: polygons.map(polygon => polygon.map(ring)) },
  }
}).sort((a, b) => a.properties.code.localeCompare(b.properties.code))

const destination = 'src/data/indiaStates.json'
fs.writeFileSync(destination, JSON.stringify({ type: 'FeatureCollection', features }) + '\n')
console.log(`${features.length} state/UT features, ${fs.statSync(destination).size} bytes`)
