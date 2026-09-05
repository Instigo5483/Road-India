/**
 * Coerces a timestamp value into a JS Date, whatever shape it arrives in:
 * an ISO string or millisecond number (the mock backend, and any
 * just-created report/profile before Firestore round-trips it), a Date
 * already, or a Firestore Timestamp instance (what a real Firestore
 * `serverTimestamp()` field comes back as once read from a snapshot).
 */
export function toDate(value) {
  if (value == null || value === '') return new Date(NaN)
  if (value && typeof value.toDate === 'function') return value.toDate()
  return value instanceof Date ? value : new Date(value)
}

export function timeAgo(isoString, locale = 'en-IN') {
  const date = toDate(isoString)
  if (!Number.isFinite(date.getTime())) return '—'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  const ranges = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  for (const [unit, secondsInUnit] of ranges) {
    const value = Math.floor(seconds / secondsInUnit)
    if (value >= 1) {
      try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
        return rtf.format(-value, unit)
      } catch {
        return `${value}${unit[0]} ago`
      }
    }
  }
  return 'just now'
}

export function formatTimestamp(isoString, locale = 'en-IN') {
  const date = toDate(isoString)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Compact "how long did this take" label -- minutes under an hour, hours
 * under two days, otherwise days. Used for the real resolvedAt-createdAt
 * turnaround shown on resolved reports (see ReportCard, ResolvedReports),
 * never a fabricated SLA figure. */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.max(Math.round(ms / 60000), 1)
  if (minutes < 60) return `${minutes} min`

  const hours = Math.round(ms / 3600000)
  if (hours < 48) return `${hours} hr${hours === 1 ? '' : 's'}`

  const days = Math.round(ms / 86400000)
  return `${days} day${days === 1 ? '' : 's'}`
}

export function resolutionDuration(report) {
  if (!report.createdAt || !report.resolvedAt) return null
  const ms = toDate(report.resolvedAt) - toDate(report.createdAt)
  return Number.isFinite(ms) && ms >= 0 ? ms : null
}

export function averageResolution(reports) {
  let total = 0
  let count = 0
  reports.forEach(report => {
    const ms = resolutionDuration(report)
    if (ms !== null) { total += ms; count += 1 }
  })
  return count ? total / count : null
}

export function timestampIso(value) {
  const date = toDate(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}
