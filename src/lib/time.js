/**
 * Coerces a timestamp value into a JS Date, whatever shape it arrives in:
 * an ISO string or millisecond number (the mock backend, and any
 * just-created report/profile before Firestore round-trips it), a Date
 * already, or a Firestore Timestamp instance (what a real Firestore
 * `serverTimestamp()` field comes back as once read from a snapshot).
 */
export function toDate(value) {
  if (value && typeof value.toDate === 'function') return value.toDate()
  return value instanceof Date ? value : new Date(value)
}

export function timeAgo(isoString, locale = 'en-IN') {
  const date = toDate(isoString)
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
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Live progress of a Blinkit/Zepto-style ETA window: given when the report
 * was created and how many minutes the response team was promised in, how
 * much of that window has elapsed right now.
 *
 * There's no real dispatch backend behind this (see EmergencyTracker /
 * EmergencyEtaBadge) -- it's a purely time-based simulation, computed
 * fresh from `createdAt` every time it's called, so every viewer (and
 * every re-render) sees a consistent, ever-advancing countdown with no
 * extra state to keep in sync.
 */
export function getEtaProgress(createdAt, etaMinutes) {
  const totalMs = etaMinutes * 60 * 1000
  const elapsedMs = Date.now() - toDate(createdAt).getTime()
  const remainingMs = Math.max(totalMs - elapsedMs, 0)
  const fraction = Math.min(Math.max(elapsedMs / totalMs, 0), 1)
  return { totalMs, elapsedMs, remainingMs, fraction, arrived: remainingMs <= 0 }
}

export function formatCountdown(ms) {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
