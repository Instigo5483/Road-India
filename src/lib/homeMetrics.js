import { normalizeCategoryId } from '../data/categoryTypes.js'

export function calculateHomeMetrics(reports) {
  const supported = reports.filter(report => normalizeCategoryId(report.category) === 'issue')
  const resolved = supported.filter(report => report.status === 'resolved')
  const rated = resolved.filter(report => report.citizenFeedback?.rating)
  return {
    filed: supported.length,
    resolved: resolved.length,
    satisfaction: rated.length
      ? Math.round(rated.reduce((sum, report) => sum + report.citizenFeedback.rating, 0) / (rated.length * 5) * 100)
      : 0,
    cities: new Set(supported.map(report => report.location?.city).filter(Boolean)).size,
  }
}

export async function fetchHomeMetrics({ projectId, apiKey, emulator = false, signal }) {
  // The web SDK cannot project fields. Use the public, rules-checked REST
  // query so counters don't wait for inline photos and resolution evidence.
  const origin = emulator ? 'http://localhost:8080' : 'https://firestore.googleapis.com'
  const response = await fetch(`${origin}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'reports' }],
        select: { fields: ['category', 'status', 'location.city', 'citizenFeedback.rating'].map(fieldPath => ({ fieldPath })) },
        // Match the report subscription, including its createdAt existence filter.
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      },
    }),
  })
  if (!response.ok) throw new Error('Could not load home metrics')
  const rows = await response.json()
  if (!Array.isArray(rows) || rows.some(row => row.error)) throw new Error('Invalid home metrics response')
  return calculateHomeMetrics(rows.filter(row => row.document).map(({ document: { fields = {} } }) => {
    const rating = fields.citizenFeedback?.mapValue?.fields?.rating
    return {
      category: fields.category?.stringValue,
      status: fields.status?.stringValue,
      location: { city: fields.location?.mapValue?.fields?.city?.stringValue },
      citizenFeedback: { rating: Number(rating?.integerValue ?? rating?.doubleValue ?? 0) },
    }
  }))
}
