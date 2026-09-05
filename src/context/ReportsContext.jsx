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
import { isFirebaseConfigured, db } from '../lib/firebase'
import { mockBackend } from '../lib/mockBackend'
import { triageReport } from '../lib/triage'
import { useAuth } from './AuthContext'
import { publicName, DEFAULT_PREFERENCES } from '../lib/preferences'

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
      // When a photo is attached, the model actually looks at it (gpt-4o-mini
      // is multimodal) rather than triaging on the text description alone.
      const aiTriage = await triageReport({ category, types, description, photoUrls })

      const base = {
        category,
        types,
        description,
        photoUrls: photoUrls ?? [],
        location,
        createdBy: user.uid,
        createdByName: publicName(user.name, user.preferences?.visibility),
        showCitizenBadge: user.preferences?.showBadge ?? DEFAULT_PREFERENCES.showBadge,
        showCivicRank: user.preferences?.showRank ?? DEFAULT_PREFERENCES.showRank,
        status: 'submitted',
        upvotes: 0,
        upvotedBy: [],
        aiTriage,
      }

      if (!isFirebaseConfigured) {
        return mockBackend.createReport(base)
      }

      // Photos stay inline as base64 data URLs rather than uploading to
      // Firebase Storage -- Storage requires the paid Blaze plan to use at
      // all, which this project intentionally stays off of (see README).
      // PhotoUpload.jsx downsizes/compresses each photo client-side before
      // it ever reaches here, keeping the whole report comfortably under
      // Firestore's 1 MiB document size limit.
      const ref = await addDoc(collection(db, 'reports'), {
        ...base,
        createdAt: serverTimestamp(),
      })

      return { id: ref.id, ...base, createdAt: new Date().toISOString() }
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
  //
  // Also stamps resolvedAt when the status becomes 'resolved' (cleared
  // otherwise, so a reopened-then-re-resolved report gets a fresh
  // timestamp) -- src/pages/AdminAnalytics.jsx uses this to compute
  // average resolution time.
  const updateReportStatus = useCallback(async (reportId, status) => {
    const patch = {
      status,
      resolvedAt: status === 'resolved' ? (isFirebaseConfigured ? serverTimestamp() : new Date().toISOString()) : null,
    }
    if (!isFirebaseConfigured) {
      return mockBackend.updateReportStatus(reportId, patch)
    }
    await updateDoc(doc(db, 'reports', reportId), patch)
  }, [])

  // Lets a citizen edit their own report's description/photos/location --
  // see ReportDetailModal.jsx / ReportEditForm.jsx for the ownership +
  // status gating (client-side only, matching this app's existing
  // prototype-grade auth caveats), and firestore.rules for the write rule.
  const updateReport = useCallback(
    async (reportId, patch) => {
      if (!user) throw new Error('Must be logged in to edit a report')
      if (!isFirebaseConfigured) {
        return mockBackend.updateReport(reportId, patch)
      }
      await updateDoc(doc(db, 'reports', reportId), patch)
    },
    [user]
  )

  // Only the citizen who filed a resolved report can leave feedback on it --
  // see ReportDetailModal.jsx (the only place this is called from) for the
  // ownership + "resolved, no feedback yet" gating, and firestore.rules for
  // the matching write rule (restricted to the report's own createdBy uid,
  // unlike the more permissive status/assignedTeams rules).
  const submitReportFeedback = useCallback(
    async (reportId, feedback) => {
      if (!user) throw new Error('Must be logged in to leave feedback')
      const citizenFeedback = { ...feedback, submittedAt: new Date().toISOString() }

      if (!isFirebaseConfigured) {
        return mockBackend.setReportFeedback(reportId, citizenFeedback)
      }
      await updateDoc(doc(db, 'reports', reportId), { citizenFeedback })
    },
    [user]
  )

  const myReports = useMemo(
    () => (user ? reports.filter((r) => r.createdBy === user.uid) : []),
    [reports, user]
  )

  const value = useMemo(
    () => ({
      reports,
      myReports,
      loading,
      createReport,
      toggleUpvote,
      updateReportStatus,
      updateReport,
      submitReportFeedback,
    }),
    [
      reports,
      myReports,
      loading,
      createReport,
      toggleUpvote,
      updateReportStatus,
      updateReport,
      submitReportFeedback,
    ]
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used inside <ReportsProvider>')
  return ctx
}
