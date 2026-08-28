// Seeds a real Firestore `reports` collection with the same demo data the
// mock backend uses, so a freshly-connected Firebase project isn't empty
// for a live demo. Safe to skip entirely -- the app works with the mock
// backend, and with a real Firebase project the community feed just
// starts empty until real reports are filed.
//
// Mirrors src/data/seedReports.js (used by the local mock backend) --
// real Indian city coordinates, varied categories/statuses, and proper
// state/district/city on each so the Ongoing Reports page's location
// filters have real values to filter by from the very first run. Keep
// the two in sync if you add/change a demo report.
//
// Usage:
//   1. Create a Firebase service account key (Project settings -> Service
//      accounts -> Generate new private key) and save it as
//      scripts/serviceAccountKey.json (already gitignored).
//   2. npm run seed
// To start from an empty collection first, run `npm run clear-data`.

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

const minutesAgo = (n) => new Date(Date.now() - 1000 * 60 * n)
const hoursAgo = (n) => minutesAgo(n * 60)
const daysAgo = (n) => hoursAgo(n * 24)

const seedReports = [
  {
    category: 'emergency',
    type: 'accident',
    description:
      'Two-vehicle collision near the flyover entrance. One person injured, traffic backing up both directions.',
    location: {
      lat: 28.6139,
      lng: 77.209,
      address: 'ITO Junction, New Delhi',
      state: 'Delhi',
      district: 'Central Delhi',
      city: 'New Delhi',
    },
    status: 'in_progress',
    upvotes: 41,
    createdByName: 'Aarav S.',
    createdAt: minutesAgo(22),
  },
  {
    category: 'problem',
    type: 'pothole',
    description:
      'Deep pothole right in the middle lane, already caused two scooters to skid this week.',
    location: {
      lat: 19.076,
      lng: 72.8777,
      address: 'Andheri West, Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      city: 'Mumbai',
    },
    status: 'in_review',
    upvotes: 28,
    createdByName: 'Priya M.',
    createdAt: hoursAgo(5),
  },
  {
    category: 'corruption',
    type: 'no_footpath',
    description:
      'Entire stretch outside the school has no footpath, kids are forced to walk on the road during peak traffic.',
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'Indiranagar, Bengaluru',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
    },
    status: 'submitted',
    upvotes: 19,
    createdByName: 'Kabir R.',
    createdAt: hoursAgo(30),
  },
  {
    category: 'problem',
    type: 'waterlogging',
    description: 'Knee-deep waterlogging every time it rains, drains clearly haven’t been cleaned.',
    location: {
      lat: 22.5726,
      lng: 88.3639,
      address: 'Salt Lake, Kolkata',
      state: 'West Bengal',
      district: 'North 24 Parganas',
      city: 'Kolkata',
    },
    status: 'resolved',
    upvotes: 63,
    createdByName: 'Rimjhim D.',
    createdAt: daysAgo(6),
    resolvedAt: daysAgo(1),
  },
  {
    category: 'corruption',
    type: 'incomplete_road_work',
    description:
      'Road widening work started 8 months ago, left half-finished with exposed rebar sticking out.',
    location: {
      lat: 17.385,
      lng: 78.4867,
      address: 'Banjara Hills, Hyderabad',
      state: 'Telangana',
      district: 'Hyderabad',
      city: 'Hyderabad',
    },
    status: 'in_progress',
    upvotes: 34,
    createdByName: 'Farhan A.',
    createdAt: hoursAgo(12),
  },
  {
    category: 'emergency',
    type: 'vehicle_breakdown',
    description: 'Truck broken down blocking one full lane on the highway service road, need a tow.',
    location: {
      lat: 23.0225,
      lng: 72.5714,
      address: 'SG Highway, Ahmedabad',
      state: 'Gujarat',
      district: 'Ahmedabad',
      city: 'Ahmedabad',
    },
    // Filed 8 minutes ago against a 10-minute ETA -- shows the live
    // "arriving in ~2 min" badge in the feed as a working demo of it.
    status: 'in_progress',
    upvotes: 9,
    createdByName: 'Meera P.',
    createdAt: minutesAgo(8),
  },
  {
    category: 'problem',
    type: 'broken_speed_breaker',
    description: 'Speed breaker has crumbled into loose chunks of concrete, sharp edges exposed.',
    location: {
      lat: 26.9124,
      lng: 75.7873,
      address: 'Malviya Nagar, Jaipur',
      state: 'Rajasthan',
      district: 'Jaipur',
      city: 'Jaipur',
    },
    status: 'in_review',
    upvotes: 14,
    createdByName: 'Devansh K.',
    createdAt: hoursAgo(3),
  },
  {
    category: 'corruption',
    type: 'missing_signs',
    description: 'Blind curve on the ghat road with zero warning signage, two near-misses this month.',
    location: {
      lat: 15.2993,
      lng: 74.124,
      address: 'Ponda, Goa',
      state: 'Goa',
      district: 'North Goa',
      city: 'Ponda',
    },
    status: 'submitted',
    upvotes: 22,
    createdByName: 'Ananya V.',
    createdAt: hoursAgo(48),
  },
  {
    category: 'problem',
    type: 'open_manhole',
    description: 'Open manhole right next to a bus stop, no barricade or warning around it at night.',
    location: {
      lat: 28.6519,
      lng: 77.1909,
      address: 'Karol Bagh, New Delhi',
      state: 'Delhi',
      district: 'West Delhi',
      city: 'New Delhi',
    },
    status: 'submitted',
    upvotes: 11,
    createdByName: 'Ishaan T.',
    createdAt: hoursAgo(2),
  },
  {
    category: 'corruption',
    type: 'no_streetlight',
    description: 'Entire lane near the market has had no working streetlight for over two months.',
    location: {
      lat: 12.2958,
      lng: 76.6394,
      address: 'Devaraja Mohalla, Mysuru',
      state: 'Karnataka',
      district: 'Mysuru',
      city: 'Mysuru',
    },
    status: 'in_review',
    upvotes: 7,
    createdByName: 'Chandana G.',
    createdAt: hoursAgo(20),
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
    resolvedAt: report.resolvedAt ?? null,
  })
}

await batch.commit()
console.log(`Seeded ${seedReports.length} demo reports into Firestore.`)
