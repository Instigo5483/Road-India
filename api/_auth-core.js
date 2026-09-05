// Shared login-token logic used by both the Vercel serverless endpoint
// (api/login.js) and the local Vite dev-server middleware (vite.config.js)
// -- same "one implementation, two entry points" pattern as
// api/_triage-core.js.
//
// signInAnonymously() mints a brand-new, unrelated Firebase Auth identity
// on every call -- there is no way to "sign back in" as a previous
// anonymous user, on this device or any other. Using that identity as the
// citizen's account meant the same Aadhaar/DigiLocker ID logged into a
// different account (different uid, different Firestore profile, a
// freshly generated name) on every login. This instead derives a UID
// deterministically from the digilockerId (a one-way hash, so the actual
// Aadhaar number is never used as-is or exposed) and mints a Firebase
// custom auth token for that UID server-side, so the same ID always
// resolves to the same Firebase Auth identity -- the existing users/{uid}
// profile (and every report authored under that uid) is then found
// correctly on every future login, from any device or browser.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { createHash } from 'node:crypto'

let adminApp
function getAdminApp(serviceAccountBase64) {
  if (adminApp) return adminApp
  if (getApps().length) {
    adminApp = getApps()[0]
    return adminApp
  }
  if (!serviceAccountBase64) return null

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'))
  adminApp = initializeApp({ credential: cert(serviceAccount) })
  return adminApp
}

// Firebase UIDs are capped at 128 chars -- a hex SHA-256 digest (64 chars)
// fits comfortably with room for the prefix.
function stableUid(digilockerId) {
  const hash = createHash('sha256').update(String(digilockerId)).digest('hex')
  return `ri-${hash.slice(0, 40)}`
}

/** Returns { token, uid } on success, or { token: null } if the Admin SDK
 * isn't configured (no FIREBASE_SERVICE_ACCOUNT) -- callers should fall
 * back to signInAnonymously() in that case rather than blocking login
 * entirely, same "degrade gracefully" pattern as the rest of this app. */
export async function mintLoginToken({ digilockerId }, serviceAccountBase64) {
  if (!digilockerId) return { token: null }

  try {
    const app = getAdminApp(serviceAccountBase64)
    if (!app) return { token: null }

    const uid = stableUid(digilockerId)
    const token = await getAuth(app).createCustomToken(uid)
    return { token, uid }
  } catch {
    return { token: null }
  }
}
