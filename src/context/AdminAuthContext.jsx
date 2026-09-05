import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { isFirebaseConfigured, auth } from '../lib/firebase'

const STORAGE_KEY = 'road_india_admin_session'

// Admin access is separate from citizen sign-in on purpose -- real
// municipal staff wouldn't authenticate through a citizen Aadhaar/DigiLocker
// flow. This is a lightweight passcode gate for the prototype, not a real
// role/permission system: there's no per-admin identity, just "knows the
// passcode or doesn't". See firestore.rules for the matching caveat on the
// `status` field (any authenticated Firebase user can move it, not just
// verified admins -- a real deployment needs custom claims here).
// Exported so AdminLogin.jsx can display it next to the form for
// evaluators/judges who need a working passcode without it being emailed
// around separately -- see that page's "test credentials" panel.
import { ADMIN_PASSCODE } from '../lib/adminAccess'

import { AdminAuthContext } from './contexts'

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(
    () => { try { return window.sessionStorage.getItem(STORAGE_KEY) === 'true' } catch { return false } }
  )
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    // A remembered UI gate must not outlive the actual Firebase session.
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* Clear memory below. */ }
        setIsAdmin(false)
      }
      setLoading(false)
    }, () => {
      setIsAdmin(false)
      setLoading(false)
    })
  }, [])

  const value = useMemo(
    () => ({
      isAdmin,
      loading,

      async loginAdmin(passcode) {
        if (passcode !== ADMIN_PASSCODE) return false

        // If a real Firestore backend is connected, the admin also needs an
        // authenticated Firebase session for the status-update rule to
        // apply (see firestore.rules) -- reuses the same anonymous
        // sign-in the citizen login flow uses, just without a profile doc.
        if (isFirebaseConfigured) {
          await auth.authStateReady()
          if (!auth.currentUser) await signInAnonymously(auth)
        }

        try { window.sessionStorage.setItem(STORAGE_KEY, 'true') } catch { /* Keep the session in memory. */ }
        setIsAdmin(true)
        return true
      },

      logoutAdmin() {
        try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* Clear in-memory access below. */ }
        setIsAdmin(false)
      },
    }),
    [isAdmin, loading]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
