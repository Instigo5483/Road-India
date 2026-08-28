// Vercel serverless function -- POST /api/login
// Mints a Firebase custom auth token for a UID derived deterministically
// from the citizen's Aadhaar/DigiLocker ID, so the same ID always signs
// into the same Firebase identity -- see api/_auth-core.js for why this
// exists instead of the client calling signInAnonymously() directly. Runs
// server-side only so the Firebase Admin SDK service account credential
// is never exposed to the browser bundle.
import { mintLoginToken } from './_auth-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await mintLoginToken(req.body ?? {}, process.env.FIREBASE_SERVICE_ACCOUNT)
  res.status(200).json(result)
}
