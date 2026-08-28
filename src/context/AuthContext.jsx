import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { isFirebaseConfigured, auth, db } from '../lib/firebase'
import { mockBackend } from '../lib/mockBackend'
import { fetchLoginToken } from '../lib/authToken'

const AuthContext = createContext(null)

/**
 * Wraps either the real Firebase Auth + Firestore user profile, or the
 * in-memory mock backend, behind one identical interface:
 *   { user, loading, completeLogin(profile), logout() }
 *
 * `user` shape: { uid, digilockerId, name, preferredLanguage, createdAt }
 * `user` is null when logged out. There's deliberately no profile-update
 * method: name comes from the simulated Aadhaar/DigiLocker verification
 * (see Login.jsx) and isn't user-editable (see Settings.jsx).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    isFirebaseConfigured ? null : mockBackend.getSession()
  )
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const unsub = mockBackend.subscribe(() =>
        setUser(mockBackend.getSession())
      )
      setLoading(false)
      return unsub
    }

    let unsubProfile = () => {}
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubProfile()
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      unsubProfile = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
        if (snap.exists()) {
          setUser({ uid: fbUser.uid, ...snap.data() })
        }
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      unsubProfile()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isMockBackend: !isFirebaseConfigured,

      async completeLogin({ digilockerId, name, preferredLanguage }) {
        if (!isFirebaseConfigured) {
          return mockBackend.findOrCreateUser({
            digilockerId,
            name,
            preferredLanguage,
          })
        }

        // A deterministic Firebase identity keyed off the Aadhaar/
        // DigiLocker ID itself, minted server-side (see lib/authToken.js,
        // api/_auth-core.js) -- signInAnonymously() alone would hand out a
        // different, unrelated uid on every single login, so the same
        // citizen re-entering the same ID would never find their existing
        // profile or reports. Falls back to a plain anonymous session if
        // the endpoint is unavailable (e.g. FIREBASE_SERVICE_ACCOUNT isn't
        // set) so login still works, just without that guarantee.
        const token = await fetchLoginToken({ digilockerId })
        const cred = token
          ? await signInWithCustomToken(auth, token)
          : await signInAnonymously(auth)
        const uid = cred.user.uid
        const ref = doc(db, 'users', uid)
        const existing = await getDoc(ref)

        const profile = existing.exists()
          ? { ...existing.data() }
          : {
              digilockerId,
              name,
              preferredLanguage: preferredLanguage || 'en',
              createdAt: serverTimestamp(),
            }

        await setDoc(ref, profile, { merge: true })
        return { uid, ...profile }
      },

      async logout() {
        if (!isFirebaseConfigured) {
          return mockBackend.signOut()
        }
        await firebaseSignOut(auth)
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
