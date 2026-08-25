// Firebase Cloud Messaging (push notifications) for the response-team PWA
// at /team. Kept separate from lib/firebase.js and only touched by team
// pages -- citizens never load this module, so an unsupported browser
// (Safari without the PWA installed, SSR, etc.) never breaks the main app.
//
// Requires: a real Firebase project with Cloud Messaging enabled, a VAPID
// key (Firebase Console -> Project settings -> Cloud Messaging -> Web
// configuration -> Generate key pair) set as VITE_FIREBASE_VAPID_KEY, and
// public/firebase-messaging-sw.js registered (see lib/teamPwa.js).
import { isSupported, getMessaging, getToken } from 'firebase/messaging'
import { app, isFirebaseConfigured } from './firebase'

/** public/firebase-messaging-sw.js is a static file -- it can't read
 * import.meta.env like the rest of the app, so the Firebase config is
 * passed through the registration URL's query string instead, and the
 * service worker reads it back out of `self.location.search`. Firebase
 * web config values aren't secret (they're scoped by Firestore/Storage
 * rules, not by hiding them), so this is safe to do in a URL. */
function buildServiceWorkerUrl() {
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

/** Requests notification permission and returns an FCM registration token,
 * or null if unsupported/denied/misconfigured. Never throws -- push is a
 * nice-to-have for the team app, not something that should block sign-in. */
export async function requestFcmToken() {
  if (!isFirebaseConfigured) return null
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return null

  try {
    if (!(await isSupported())) return null
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return null
    } else if (Notification.permission !== 'granted') {
      return null
    }

    const registration = await navigator.serviceWorker.register(buildServiceWorkerUrl(), {
      scope: '/team/',
    })
    const messaging = getMessaging(app)
    return await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
  } catch {
    return null
  }
}
