// Client wrapper for POST /api/dispatch -- see api/_dispatch-core.js for
// what actually runs (nearest-available-team matching + push notification,
// via a free-tier Vercel serverless function rather than a Firebase Cloud
// Function, which would require the paid Blaze plan).
//
// Fire-and-forget from ReportsContext.createReport right after an
// emergency report is created: never throws, never blocks report
// creation on a flaky dispatch call.
export async function dispatchEmergency({ reportId, category, type, description, location }) {
  try {
    await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, category, type, description, location }),
    })
  } catch {
    // Ignored -- see file comment.
  }
}
