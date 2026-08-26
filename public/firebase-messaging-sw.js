// Firebase Cloud Messaging background handler for the response-team
// dashboard (a normal website, not an installed app). Static file (service
// workers can't be built by Vite / read import.meta.env), so the Firebase
// config is read from this registration URL's query string -- see
// lib/messaging.js's buildServiceWorkerUrl(). Only ever registered for
// team routes (scope: "/team/"), never for the citizen-facing site.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

const params = new URLSearchParams(self.location.search)
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

// Fires when a push arrives while the app isn't in the foreground -- shows
// a native OS notification. Tapping it opens/focuses the team dashboard.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'New emergency dispatch'
  self.registration.showNotification(title, {
    body: payload.notification?.body ?? 'Tap to view details',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data ?? {},
    tag: payload.data?.reportId ?? 'road-india-dispatch',
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/team'))
      if (existing) return existing.focus()
      return self.clients.openWindow('/team')
    })
  )
})
