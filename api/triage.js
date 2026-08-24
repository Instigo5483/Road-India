// Vercel serverless function -- POST /api/triage
// Runs server-side only so OPENAI_API_KEY is never exposed to the browser
// bundle (unlike Firebase's client config, which is safe to ship because
// it's locked down by firestore.rules/storage.rules instead of secrecy).
import { runTriage } from './_triage-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await runTriage(req.body ?? {}, process.env.OPENAI_API_KEY)
  res.status(200).json(result)
}
