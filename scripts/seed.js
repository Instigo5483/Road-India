// Seeds a real Firestore `reports` collection with the same demo data the
// mock backend uses, so a freshly-connected Firebase project isn't empty
// for a live demo. Safe to skip entirely -- the app works with the mock
// backend, and with a real Firebase project the community feed just
// starts empty until real reports are filed.
//
// Usage:
//   1. Create a Firebase service account key (Project settings -> Service
//      accounts -> Generate new private key) and save it as
//      scripts/serviceAccountKey.json (already gitignored).
//   2. npm run seed

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let serviceAccount
try {
  serviceAccount = JSON.parse(
    readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8')
  )
} catch {
  console.error(
    'Missing scripts/serviceAccountKey.json. Download it from Firebase Console -> ' +
      'Project settings -> Service accounts -> Generate new private key, then re-run `npm run seed`.'
  )
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const seedReports = [
  {
    category: 'emergency',
    type: 'accident',
    description:
      'Two-vehicle collision near the flyover entrance. One person injured, traffic backing up both directions.',
    location: { lat: 28.6139, lng: 77.209, address: 'ITO Junction, New Delhi' },
    status: 'in_progress',
    upvotes: 41,
  },
  {
    category: 'problem',
    type: 'pothole',
    description: 'Deep pothole right in the middle lane, already caused two scooters to skid this week.',
    location: { lat: 19.076, lng: 72.8777, address: 'Andheri West, Mumbai' },
    status: 'in_review',
    upvotes: 28,
  },
  {
    category: 'corruption',
    type: 'no_footpath',
    description:
      'Entire stretch outside the school has no footpath, kids are forced to walk on the road during peak traffic.',
    location: { lat: 12.9716, lng: 77.5946, address: 'Indiranagar, Bengaluru' },
    status: 'submitted',
    upvotes: 19,
  },
]

const batch = db.batch()
for (const report of seedReports) {
  const ref = db.collection('reports').doc()
  batch.set(ref, {
    ...report,
    photoUrls: [],
    upvotedBy: [],
    createdBy: 'seed-script',
    createdByName: 'Demo seed',
    createdAt: new Date(),
  })
}

await batch.commit()
console.log(`Seeded ${seedReports.length} demo reports into Firestore.`)
