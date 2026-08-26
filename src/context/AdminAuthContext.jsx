import { createContext, useContext, useMemo, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
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
export const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'roadindia-admin'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === 'true'
  )

  const value = useMemo(
    () => ({
      isAdmin,

      async loginAdmin(passcode) {
        if (passcode !== ADMIN_PASSCODE) return false

        // If a real Firestore backend is connected, the admin also needs an
        // authenticated Firebase session for the status-update rule to
        // apply (see firestore.rules) -- reuses the same anonymous
        // sign-in the citizen login flow uses, just without a profile doc.
        if (isFirebaseConfigured && !auth.currentUser) {
          await signInAnonymously(auth)
        }

        window.sessionStorage.setItem(STORAGE_KEY, 'true')
        setIsAdmin(true)
        return true
      },

      logoutAdmin() {
        window.sessionStorage.removeItem(STORAGE_KEY)
        setIsAdmin(false)
      },
    }),
    [isAdmin]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return ctx
}
