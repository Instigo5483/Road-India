import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore'
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import { isFirebaseConfigured, db, storage } from '../lib/firebase'
import { mockBackend } from '../lib/mockBackend'
import { triageReport } from '../lib/triage'
import { dispatchEmergency } from '../lib/dispatch'
import { useAuth } from './AuthContext'

/** Uploads each base64 photo data-URL to Firebase Storage and returns the
 * public download URLs. Falls back to keeping the base64 strings as-is if
 * any individual upload fails, so a flaky photo never blocks the report. */
async function uploadPhotos(photoDataUrls, uid) {
  const uploads = photoDataUrls.map(async (dataUrl, i) => {
    try {
      const path = `reports/${uid}/${Date.now()}-${i}.jpg`
      const fileRef = storageRef(storage, path)
      await uploadString(fileRef, dataUrl, 'data_url')
      return getDownloadURL(fileRef)
    } catch {
      return dataUrl
    }
  })
  return Promise.all(uploads)
}

const ReportsContext = createContext(null)

export function ReportsProvider({ children }) {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      let cancelled = false
      const load = () => mockBackend.listReports().then((r) => !cancelled && setReports(r))
      load()
      setLoading(false)
      const unsub = mockBackend.subscribe(load)
      return () => {
        cancelled = true
        unsub()
      }
    }

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const createReport = useCallback(
    async ({ category, types, description, photoUrls, location }) => {
      if (!user) throw new Error('Must be logged in to file a report')

      // AI-assisted triage (severity, likely department, caseworker summary)
      // -- a real OpenAI call server-side (see api/_triage-core.js), with a
      // rule-based mock fallback so filing a report never blocks on it.
      const aiTriage = await triageReport({ category, types, description })

      const base = {
        category,
        types,
        description,
        photoUrls: photoUrls ?? [],
        location,
        createdBy: user.uid,
        createdByName: user.name,
        // Emergencies skip the review queue -- a response team is treated
        // as dispatched the instant the report is filed (see
        // components/EmergencyTracker for the live ETA shown to the user).
        status: category === 'emergency' ? 'in_progress' : 'submitted',
        upvotes: 0,
        upvotedBy: [],
        aiTriage,
      }

      if (!isFirebaseConfigured) {
        return mockBackend.createReport(base)
      }

      const uploadedPhotoUrls = base.photoUrls.length
        ? await uploadPhotos(base.photoUrls, user.uid)
        : []

      const ref = await addDoc(collection(db, 'reports'), {
        ...base,
        photoUrls: uploadedPhotoUrls,
        createdAt: serverTimestamp(),
      })

      // Emergency dispatch (nearest available response team + push
      // notification) -- fired after the report exists so it has a real
      // id, never awaited-to-block since a flaky dispatch call shouldn't
      // stop the citizen from having successfully filed. See
      // lib/dispatch.js / api/_dispatch-core.js.
      if (category === 'emergency') {
        dispatchEmergency({ reportId: ref.id, category, types, description, location })
      }

      return { id: ref.id, ...base, photoUrls: uploadedPhotoUrls, createdAt: new Date().toISOString() }
    },
    [user]
  )

  const toggleUpvote = useCallback(
    async (reportId) => {
      if (!user) throw new Error('Must be logged in to support a report')

      if (!isFirebaseConfigured) {
        return mockBackend.toggleUpvote(reportId, user.uid)
      }

      const report = reports.find((r) => r.id === reportId)
      if (!report) return
      const already = (report.upvotedBy ?? []).includes(user.uid)
      await updateDoc(doc(db, 'reports', reportId), {
        upvotes: increment(already ? -1 : 1),
        upvotedBy: already ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
    },
    [reports, user]
  )

  // Admin-only action -- see context/AdminAuthContext.jsx for the (separate
  // from citizen login) passcode gate in front of the /admin route that
  // calls this. Doesn't require a citizen `user`, since admins don't sign
  // in through the citizen flow at all.
  const updateReportStatus = useCallback(async (reportId, status) => {
    if (!isFirebaseConfigured) {
      return mockBackend.updateReportStatus(reportId, status)
    }
    await updateDoc(doc(db, 'reports', reportId), { status })
  }, [])

  const myReports = useMemo(
    () => (user ? reports.filter((r) => r.createdBy === user.uid) : []),
    [reports, user]
  )

  const value = useMemo(
    () => ({ reports, myReports, loading, createReport, toggleUpvote, updateReportStatus }),
    [reports, myReports, loading, createReport, toggleUpvote, updateReportStatus]
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used inside <ReportsProvider>')
  return ctx
}
