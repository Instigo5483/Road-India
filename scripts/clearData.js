// Deletes every document in the reports, users, and teams collections --
// used to wipe out test/QA data before a hackathon demo so the seed
// scripts (seed.js, seedTeams.js) start from a clean slate. Destructive
// and irreversible; only ever run this deliberately.
//
// Usage: same service account key as scripts/seed.js, then:
//   npm run clear-data

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
      'Project settings -> Service accounts -> Generate new private key, then re-run `npm run clear-data`.'
  )
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Firestore batches cap out at 500 writes, so a collection larger than
// that needs multiple passes -- fine for hackathon-scale data, but this
// loops properly rather than assuming everything fits in one batch.
async function clearCollection(name) {
  const collectionRef = db.collection(name)
  let totalDeleted = 0

  while (true) {
    const snap = await collectionRef.limit(500).get()
    if (snap.empty) break

    const batch = db.batch()
    snap.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    totalDeleted += snap.size
  }

  console.log(`Cleared ${totalDeleted} document(s) from '${name}'.`)
  return totalDeleted
}

const collections = ['reports', 'users', 'teams']
let grandTotal = 0
for (const name of collections) {
  grandTotal += await clearCollection(name)
}

console.log(`Done -- ${grandTotal} document(s) deleted across ${collections.join(', ')}.`)
