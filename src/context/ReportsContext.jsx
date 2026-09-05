import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  runTransaction,
} from 'firebase/firestore'
import { isFirebaseConfigured, db } from '../lib/firebase'
import { mockBackend } from '../lib/mockBackend'
import { triageReport } from '../lib/triage'
import { useAuth } from './useAppContext'
import { publicName, DEFAULT_PREFERENCES } from '../lib/preferences'
import { prepareResolution } from '../lib/resolution'

import { assertEditable, upvotePatch, validateContent, validateFeedback } from '../lib/reportValidation'
import { normalizeCategoryId } from '../data/categoryTypes'
import { useLanguage } from './useAppContext'

import { ReportsContext } from './contexts'

export function ReportsProvider({ children }) {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const pendingVotes = useRef(new Map())
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    const fail = () => { setLoadError(true); setLoading(false) }
    const supported = rows => rows.filter(r => normalizeCategoryId(r.category) === 'issue')
    if (!isFirebaseConfigured) {
      let cancelled = false
      const load = () => mockBackend.listReports().then(r => {
        if (!cancelled) { setReports(supported(r)); setLoading(false) }
      }).catch(() => { if (!cancelled) fail() })
      load()
      const unsub = mockBackend.subscribe(load)
      return () => {
        cancelled = true
        unsub()
      }
    }

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setReports(supported(snap.docs.map(d => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }))))
      setLoading(false)
    }, fail)
    return unsub
  }, [retry])

  const createReport = useCallback(
    async ({ category, types, description, photoUrls, location }) => {
      if (!user) throw new Error('Must be logged in to file a report')
      validateContent({ description, photoUrls: photoUrls ?? [], location })

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

  const toggleUpvote = useCallback((reportId) => {
    if (!user) return Promise.reject(new Error('Must be logged in to support a report'))
    const key = user.uid + ':' + reportId
    if (pendingVotes.current.has(key)) return pendingVotes.current.get(key)
    const task = (async () => {
      if (!isFirebaseConfigured) return mockBackend.toggleUpvote(reportId, user.uid)
      const ref = doc(db, 'reports', reportId)
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(ref)
        if (!snap.exists()) throw new Error('Report unavailable')
        transaction.update(ref, upvotePatch(snap.data(), user.uid))
      })
    })().finally(() => pendingVotes.current.delete(key))
    pendingVotes.current.set(key, task)
    return task
  }, [user])

  // Non-final changes only; closing a report requires resolution evidence.
  const updateReportStatus = useCallback(async (reportId, status) => {
    if (!['submitted', 'in_review', 'in_progress'].includes(status)) throw new Error('Use resolution proof to close a report')
    const current = reports.find(r => r.id === reportId)
    if (!current || current.status === 'resolved') throw new Error('Report unavailable or already resolved')
    const patch = { status, resolvedAt: null }
    if (!isFirebaseConfigured) {
      return mockBackend.updateReportStatus(reportId, patch)
    }
    await updateDoc(doc(db, 'reports', reportId), patch)
  }, [reports])

  // Lets a citizen edit their own report's description/photos/location --
  // see ReportDetailModal.jsx / ReportEditForm.jsx for the ownership +
  // status gating (also enforced in the updated rules; matching this app's existing
  // prototype-grade auth caveats), and firestore.rules for the write rule.
  const updateReport = useCallback(
    async (reportId, patch) => {
      if (!user) throw new Error('Must be logged in to edit a report')
      validateContent(patch)
      if (!isFirebaseConfigured) {
        assertEditable(reports.find(r => r.id === reportId), user.uid)
        return mockBackend.updateReport(reportId, patch)
      }
      const ref = doc(db, 'reports', reportId)
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(ref)
        assertEditable(snap.exists() ? snap.data() : null, user.uid)
        transaction.update(ref, patch)
      })
    },
    [user, reports]
  )

  // Only the citizen who filed a resolved report can leave feedback on it --
  // see ReportDetailModal.jsx (the only place this is called from) for the
  // ownership + "resolved, no feedback yet" gating, and firestore.rules for
  // the matching write rule (restricted to the report's own createdBy uid,
  // unlike the prototype status permission).
  const submitReportFeedback = useCallback(
    async (reportId, feedback) => {
      if (!user) throw new Error('Must be logged in to leave feedback')
      const citizenFeedback = { ...feedback, submittedAt: new Date().toISOString() }

      if (!isFirebaseConfigured) {
        validateFeedback(reports.find(r => r.id === reportId), user.uid, feedback)
        return mockBackend.setReportFeedback(reportId, citizenFeedback)
      }
      const ref = doc(db, 'reports', reportId)
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(ref)
        validateFeedback(snap.exists() ? snap.data() : null, user.uid, feedback)
        transaction.update(ref, { citizenFeedback })
      })
    },
    [user, reports]
  )

  const myReports = useMemo(
    () => (user ? reports.filter((r) => r.createdBy === user.uid) : []),
    [reports, user]
  )

  const resolveWithProof = useCallback(async (reportId, proof) => {
    const report = reports.find(r => r.id === reportId)
    const patch = prepareResolution(report, proof)
    if (!isFirebaseConfigured) return mockBackend.updateReportStatus(reportId, patch)
    const ref = doc(db, 'reports', reportId)
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(ref)
      const current = snap.exists() ? snap.data() : null
      transaction.update(ref, { ...prepareResolution(current, proof), resolvedAt: serverTimestamp() })
    })
  }, [reports])

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
      resolveWithProof,
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
      resolveWithProof,
    ]
  )

  return <ReportsContext.Provider value={value}>
    {children}
    {loadError && <div role="alert" className="fixed inset-x-4 bottom-24 z-[110] mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800 shadow-card">
      {lang === 'hi' ? 'रिपोर्ट लोड नहीं हो सकीं। कनेक्शन और अनुमतियाँ जाँचें।' : 'Could not load reports. Check your connection and permissions.'}
      <button type="button" className="ml-3 min-h-10 font-semibold underline" onClick={() => setRetry(n => n + 1)}>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</button>
    </div>}
  </ReportsContext.Provider>
}
