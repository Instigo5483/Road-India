import { toDate } from './time.js'

// A citizen's "Civic Points" score -- always computed live from their own
// reports, never a stored counter, matching this app's existing rule that
// every stat on the dashboard comes from real data (see Home.jsx). Points
// reward the two signals that require someone *else's* independent
// action -- a report reaching `resolved` (an admin acted on it) and
// upvotes from other citizens (community corroboration) -- over anything
// self-reported, and are capped per-report so no single report can
// dominate the score.
//
// The score itself is uncapped and resets every calendar month rather
// than being capped at a fixed ceiling -- a hard cap fights against
// genuinely active citizens (someone who could earn 2,000 points in a
// good month gets flattened to the same 1,000 as someone who barely
// qualifies), whereas a monthly reset keeps the number meaningful as
// "how are you doing lately" without needing an arbitrary max.

export const CIVIC_POINTS = {
  FILED: 5,
  RESOLVED: 30,
  PER_UPVOTE: 2,
  MAX_UPVOTE_BONUS_PER_REPORT: 20,
  PHOTO_ATTACHED: 5,
  CONFIRMED_RESOLVED: 10,
}

/** Point value of a single report. */
export function civicPointsForReport(report) {
  let points = CIVIC_POINTS.FILED

  if (report.status === 'resolved') {
    points += CIVIC_POINTS.RESOLVED
  }

  const upvoteBonus = Math.min(
    Math.max(0, report.upvotes ?? 0) * CIVIC_POINTS.PER_UPVOTE,
    CIVIC_POINTS.MAX_UPVOTE_BONUS_PER_REPORT
  )
  points += upvoteBonus

  if (report.photoUrls?.length > 0) {
    points += CIVIC_POINTS.PHOTO_ATTACHED
  }

  if (report.citizenFeedback?.confirmedResolved === true) {
    points += CIVIC_POINTS.CONFIRMED_RESOLVED
  }

  return points
}

/** The calendar-month window Civic Points resets on, in local time. */
export function getCurrentPeriod(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
}

/** A report counts toward the *current* period if its most meaningful
 * activity happened this period -- resolution if it has one (the
 * dominant point event), otherwise when it was filed. Keying off
 * resolvedAt when present (rather than always createdAt) means a report
 * filed near a month boundary and resolved just after still gets scored
 * once, instead of falling through the gap between periods. */
function isInPeriod(report, period) {
  const activityDate = toDate(report.resolvedAt ?? report.createdAt)
  return activityDate >= period.start && activityDate < period.end
}

/** Total Civic Points across a citizen's own reports active in the
 * current period (uncapped). */
export function computeCivicPoints(reports, now = new Date()) {
  const period = getCurrentPeriod(now)
  return reports
    .filter((r) => isInPeriod(r, period))
    .reduce((sum, r) => sum + civicPointsForReport(r), 0)
}
