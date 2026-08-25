// Creates a new response team from the admin dashboard (see
// components/AddTeamForm.jsx). Auto-generates both the team ID and its
// passcode -- a real deployment would send these to the team through a
// proper onboarding channel; here they're shown once in the admin UI right
// after creation, the same "provision once, copy now" pattern most systems
// use for one-time credentials.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const TYPE_PREFIX = {
  ambulance: 'amb',
  doctor: 'doc',
  fire: 'fire',
  police: 'police',
  tow: 'tow',
}

// Excludes visually-confusable characters (0/O, 1/l/I) so a typed-out
// passcode is easy to read back correctly.
const ID_CHARS = '0123456789'
const PASSCODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'

function randomSegment(length, chars) {
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

async function generateUniqueTeamId(type) {
  const prefix = TYPE_PREFIX[type] ?? 'team'
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = `${prefix}-${randomSegment(4, ID_CHARS)}`
    const snap = await getDoc(doc(db, 'teams', id))
    if (!snap.exists()) return id
  }
  // Astronomically unlikely after 5 random misses, but fall back to a
  // timestamp-suffixed id so this can never loop forever.
  return `${prefix}-${Date.now()}`
}

/** Creates a new response team. Returns { id, passcode } for the caller to
 * display once. `location` is a { lat, lng, address? } object, same shape
 * MapPicker already produces elsewhere in this app. */
export async function createTeam({ name, type, location }) {
  const id = await generateUniqueTeamId(type)
  const passcode = randomSegment(10, PASSCODE_CHARS)

  await setDoc(doc(db, 'teams', id), {
    name,
    type,
    location,
    passcode,
    status: 'available',
    fcmToken: null,
    currentReportId: null,
  })

  return { id, passcode }
}
