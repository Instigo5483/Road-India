// Vercel serverless function -- POST /api/dispatch
// Called by the client right after an emergency report is created (see
// context/ReportsContext.jsx's createReport) rather than a Firestore
// trigger, so the whole feature stays on Firebase's free Spark plan --
// see api/_dispatch-core.js for why. Runs server-side only so the
// Firebase Admin SDK service account credential is never exposed to the
// browser bundle.
import { runDispatch } from './_dispatch-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await runDispatch(req.body ?? {}, process.env.FIREBASE_SERVICE_ACCOUNT)
  res.status(200).json(result)
}
