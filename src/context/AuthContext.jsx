import { useEffect, useMemo, useState } from 'react'
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
  getDocs, collection, query, where, writeBatch,
} from 'firebase/firestore'
import { DEFAULT_PREFERENCES, publicName } from '../lib/preferences'
import { isFirebaseConfigured, auth, db } from '../lib/firebase'
import { mockBackend } from '../lib/mockBackend'
import { fetchLoginToken } from '../lib/authToken'

import { AuthContext } from './contexts'

/**
 * Wraps either the real Firebase Auth + Firestore user profile, or the
 * in-memory mock backend, behind one identical interface:
 *   { user, loading, completeLogin(profile), logout() }
 *
 * `user` shape: { uid, digilockerId, name, preferredLanguage, createdAt }
 * `user` is null when logged out. savePreferences updates display/privacy
 * preferences only; the simulated account name remains read-only.
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
      setUser(null)
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      unsubProfile = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
        if (snap.exists()) {
          setUser({ ...snap.data(), uid: fbUser.uid })
        } else {
          setUser(null)
        }
        setLoading(false)
      }, () => { setUser(null); setLoading(false) })
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

      async savePreferences(settings, preferredLanguage) {
        if (!user) throw new Error('Sign in first')
        const preferences = { ...DEFAULT_PREFERENCES, ...settings }
        const publicFields = {
          createdByName: publicName(user.name, preferences.visibility),
          showCitizenBadge: preferences.showBadge,
          showCivicRank: preferences.showRank,
        }
        if (!isFirebaseConfigured) return mockBackend.savePreferences(preferences, preferredLanguage, publicFields)
        // Only the caller's report presentation fields are changed; identity stays private in users.
        const own = await getDocs(query(collection(db, 'reports'), where('createdBy', '==', user.uid)))
        for (let i = 0; i < own.docs.length; i += 400) {
          const batch = writeBatch(db)
          own.docs.slice(i, i + 400).forEach(report => batch.update(report.ref, publicFields))
          await batch.commit()
        }
        await setDoc(doc(db, 'users', user.uid), { preferences, preferredLanguage }, { merge: true })
      },

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
        const sameAccount = user?.digilockerId === digilockerId && auth.currentUser?.uid === user.uid
        const token = sameAccount ? null : await fetchLoginToken({ digilockerId })
        const cred = sameAccount ? { user: auth.currentUser } : token
          ? await signInWithCustomToken(auth, token)
          : await signInAnonymously(auth)
        const uid = cred.user.uid
        const ref = doc(db, 'users', uid)
        const existing = await getDoc(ref)

        const profile = existing.exists()
          ? {
              ...existing.data(),
              preferredLanguage:
                preferredLanguage || existing.data().preferredLanguage || 'en',
            }
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
