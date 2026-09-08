import { indiaOverviewBounds } from './indiaOverview.js'

// Extent of indiaStates.json, including Lakshadweep and the Nicobar islands.
// Keep ordinary pin maps lightweight: they don't need the full state geometry.
// The boundary test verifies this extent against that geometry.
export const INDIA_COUNTRY_BBOX = [68.09347709896305, 6.75436793493344, 97.41149826167937, 37.077491176566696]
export const INDIA_PAN_BOUNDS = indiaOverviewBounds([{ bbox: INDIA_COUNTRY_BBOX }]).pan

export function indiaViewportBounds(size, project, unproject) {
  const [[south, west], [north, east]] = INDIA_PAN_BOUNDS
  const nw = project([north, west]), se = project([south, east])
  const centerX = (nw.x + se.x) / 2, centerY = (nw.y + se.y) / 2
  // When zoomed out, an axis wider than India must stay centered. Expanding
  // only to the viewport size prevents inverted drag limits and jumpy panning.
  // This is always based on India, never the dragged viewport, so it cannot drift.
  const halfWidth = Math.max(se.x - nw.x, size.x) / 2
  const halfHeight = Math.max(se.y - nw.y, size.y) / 2
  const bottomLeft = unproject([centerX - halfWidth, centerY + halfHeight])
  const topRight = unproject([centerX + halfWidth, centerY - halfHeight])
  return [[bottomLeft.lat, bottomLeft.lng], [topRight.lat, topRight.lng]]
}
