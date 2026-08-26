// Client wrapper for POST /api/triage -- see api/_triage-core.js for what
// actually runs (real OpenAI call server-side, with a mock fallback).
//
// Returns null on any failure so a broken/slow triage call never blocks a
// citizen from filing a report -- ReportFlow just files the report without
// an AI assessment attached rather than showing an error.
export async function triageReport({ category, types, description }) {
  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, types, description }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
