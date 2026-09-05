// Firebase initialization.
//
// All config values come from Vite env vars (see .env.example). Copy
// .env.example to .env.local and fill in your Firebase project's values
// before running the app for real. Until then, the app still runs using
// an in-memory mock backend (see lib/mockBackend.js) so the UI can be
// demoed without any setup.

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// True once real Firebase credentials are present. When false, the app
// falls back to the in-memory mock backend so `npm run dev` works out of
// the box for a quick demo, hackathon judging, or local UI development.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
)

let auth
let db

if (isFirebaseConfigured) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
  }
}

export { auth, db }
