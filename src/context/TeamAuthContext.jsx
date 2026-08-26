import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'

const STORAGE_KEY = 'road_india_team_id'

/**
 * Response-team auth is a separate, simpler concept from both citizen
 * login (AuthContext) and the admin passcode gate (AdminAuthContext):
 * each team has its own document in Firestore's `teams` collection with a
 * passcode field. There's no real per-team Firebase identity -- login
 * signs in anonymously (needed so firestore.rules' `request.auth != null`
 * checks pass) purely to satisfy Firestore, then verifies the passcode
 * against the team doc directly. See firestore.rules for the matching
 * "this is prototype-grade, not real access control" caveat.
 *
 * This entire feature requires a real Firebase project -- there is no
 * mock-backend equivalent for Cloud Functions + Cloud Messaging, so
 * `team` stays null and `unavailable: true` when Firebase isn't configured.
 */
const TeamAuthContext = createContext(null)

export function TeamAuthProvider({ children }) {
  // `teamId` (not just localStorage) is the thing that drives the
  // subscription effect below -- login/logout update this state directly
  // so the onSnapshot listener restarts immediately, instead of only being
  // established once on mount (which meant a fresh login showed a static
  // one-time snapshot that never updated again until a full page reload).
  const [teamId, setTeamId] = useState(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  )
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured && !!teamId)

  useEffect(() => {
    if (!isFirebaseConfigured || !teamId) {
      setTeam(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = onSnapshot(
      doc(db, 'teams', teamId),
      (snap) => {
        setTeam(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [teamId])

  const loginTeam = useCallback(async (id, passcode) => {
    const trimmedId = id.trim()
    const justSignedIn = !auth.currentUser
    if (justSignedIn) await signInAnonymously(auth)

    const ref = doc(db, 'teams', trimmedId)

    let snap
    try {
      snap = await getDoc(ref)
    } catch (err) {
      // Right after signInAnonymously resolves, Firestore's own internal
      // auth-token listener can lag a beat behind it, so this very first
      // read can fail with a permission error even though the sign-in
      // itself succeeded -- without this retry, that shows up as "the
      // first login attempt does nothing, the second one works" (the
      // second attempt has no sign-in race to hit). Only retry when we
      // just signed in; a wrong ID/passcode should still fail immediately.
      if (!justSignedIn) throw err
      await new Promise((resolve) => setTimeout(resolve, 400))
      snap = await getDoc(ref)
    }

    const data = snap.data()
    if (!snap.exists() || data.passcode !== passcode) return false

    // Resume as 'busy' if this team still has an active dispatch (e.g. they
    // logged out and back in mid-job) rather than always resetting to
    // 'available' -- otherwise re-logging in would silently make an
    // already-busy team eligible for a second dispatch on top of their
    // current one.
    const status = data.currentReportId ? 'busy' : 'available'
    await updateDoc(ref, { status })
    window.localStorage.setItem(STORAGE_KEY, trimmedId)
    // Set loading true in the same tick as teamId, not just inside the
    // effect below -- otherwise there's a render where teamId is already
    // set but loading is still whatever it was before (false, on a fresh
    // page), so TeamProtectedRoute sees "no team, not loading" and bounces
    // straight back to /team/login before the effect even runs. That's
    // what made the very first login attempt after a fresh page load
    // silently fail, requiring a second attempt (by which point the effect
    // had already flipped loading to true from the first attempt).
    setLoading(true)
    setTeamId(trimmedId)
    return true
  }, [])

  const logoutTeam = useCallback(async () => {
    if (team) {
      await updateDoc(doc(db, 'teams', team.id), { status: 'offline', fcmToken: null }).catch(() => {})
    }
    window.localStorage.removeItem(STORAGE_KEY)
    setTeamId(null)
    await firebaseSignOut(auth).catch(() => {})
  }, [team])

  const updateTeam = useCallback(
    async (patch) => {
      if (!team) return
      await updateDoc(doc(db, 'teams', team.id), patch)
    },
    [team]
  )

  const value = useMemo(
    () => ({
      team,
      loading,
      unavailable: !isFirebaseConfigured,
      loginTeam,
      logoutTeam,
      updateTeam,
    }),
    [team, loading, loginTeam, logoutTeam, updateTeam]
  )

  return <TeamAuthContext.Provider value={value}>{children}</TeamAuthContext.Provider>
}

export function useTeamAuth() {
  const ctx = useContext(TeamAuthContext)
  if (!ctx) throw new Error('useTeamAuth must be used inside <TeamAuthProvider>')
  return ctx
}
