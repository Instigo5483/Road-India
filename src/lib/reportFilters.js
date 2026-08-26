// Shared by the citizen Ongoing Reports feed (pages/ReportsFeed.jsx) and
// the admin dashboard (pages/Admin.jsx), so both filter panels stay in
// sync instead of drifting apart.

export const TIME_RANGES = [
  { id: 'all', key: 'reports.time.all', ms: null },
  { id: '24h', key: 'reports.time.24h', ms: 1000 * 60 * 60 * 24 },
  { id: '7d', key: 'reports.time.7d', ms: 1000 * 60 * 60 * 24 * 7 },
  { id: '30d', key: 'reports.time.30d', ms: 1000 * 60 * 60 * 24 * 30 },
]

/** Unique, sorted, non-empty values for `field` among reports matching `predicate`. */
export function uniqueValues(reports, field, predicate = () => true) {
  const values = new Set()
  reports.forEach((r) => {
    const v = r.location?.[field]
    if (v && predicate(r)) values.add(v)
  })
  return [...values].sort((a, b) => a.localeCompare(b))
}
