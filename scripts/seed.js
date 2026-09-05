// Adds the shared fictional demo reports without overwriting existing documents.
// Requires scripts/serviceAccountKey.json. Run deliberately; never as part of UI tests.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { seedReports } from '../src/data/seedReports.js'

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

const batch = db.batch()
for (const { id, ...report } of seedReports) {
  const ref = db.collection('reports').doc(id)
  batch.create(ref, {
    ...report,
    createdAt: new Date(report.createdAt),
    photoUrls: [],
    upvotedBy: [],
    createdBy: 'seed-script',
    resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null,
  })
}

await batch.commit()
console.log(`Seeded ${seedReports.length} demo reports into Firestore.`)
