// Seeds a handful of demo response teams into Firestore's `teams`
// collection so there's something for the dispatch endpoint
// (api/_dispatch-core.js) to actually match against, and something to sign
// into at /team/login. Safe to re-run -- uses fixed doc IDs, so it
// overwrites rather than duplicates.
//
// Usage: same service account key as scripts/seed.js, then:
//   npm run seed:teams

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8'))
} catch {
  console.error(
    'Missing scripts/serviceAccountKey.json. Download it from Firebase Console -> ' +
      'Project settings -> Service accounts -> Generate new private key, then re-run `npm run seed:teams`.'
  )
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Passcodes are plaintext, deliberately -- see TeamAuthContext.jsx and
// firestore.rules for why this is a prototype-only auth mechanism, not
// real security. Change these before sharing a live deployment link.
const teams = [
  {
    id: 'amb-001',
    name: 'Ambulance Unit 1 — Central Delhi',
    type: 'ambulance',
    passcode: 'amb-001-pass',
    location: { lat: 28.6139, lng: 77.209 },
  },
  {
    id: 'doc-001',
    name: 'Rapid Medical Response — Central Delhi',
    type: 'doctor',
    passcode: 'doc-001-pass',
    location: { lat: 28.6205, lng: 77.2141 },
  },
  {
    id: 'police-001',
    name: 'Traffic Police Unit 4 — Central Delhi',
    type: 'police',
    passcode: 'police-001-pass',
    location: { lat: 28.6025, lng: 77.1995 },
  },
  {
    id: 'amb-002',
    name: 'Ambulance Unit 2 — Ahmedabad',
    type: 'ambulance',
    passcode: 'amb-002-pass',
    location: { lat: 23.0225, lng: 72.5714 },
  },
  {
    id: 'tow-001',
    name: 'Highway Tow Service — Ahmedabad',
    type: 'tow',
    passcode: 'tow-001-pass',
    location: { lat: 23.03, lng: 72.58 },
  },
  {
    id: 'fire-001',
    name: 'Fire Station 7 — Bengaluru',
    type: 'fire',
    passcode: 'fire-001-pass',
    location: { lat: 12.9716, lng: 77.5946 },
  },
]

const batch = db.batch()
for (const team of teams) {
  const { id, ...data } = team
  batch.set(db.collection('teams').doc(id), {
    ...data,
    status: 'available',
    fcmToken: null,
    currentReportId: null,
  })
}

await batch.commit()
console.log(`Seeded ${teams.length} demo response teams into Firestore.`)
console.log('Sign in at /team/login with any team ID above and its passcode.')
