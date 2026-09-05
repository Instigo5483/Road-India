// Client wrapper for POST /api/login -- see api/_auth-core.js for what
// actually runs (deterministic custom-token minting via the Firebase
// Admin SDK).
//
// Returns null if the endpoint is unavailable or the Admin SDK isn't
// configured (no FIREBASE_SERVICE_ACCOUNT) -- AuthContext falls back to
// signInAnonymously() in that case, so login still works (with the old
// per-session-identity caveat) rather than failing outright.
import { fetchJson } from './request.js'

export async function fetchLoginToken({ digilockerId }) {
  try {
    const { token } = await fetchJson('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ digilockerId }),
    })
    return token ?? null
  } catch {
    return null
  }
}
