import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../context/ReportsContext'
import { useToast } from '../context/ToastContext'
import {
  reportTypeIds,
  getTypesLabel,
} from '../data/categoryTypes'
import { timeAgo, formatTimestamp } from '../lib/time'
import { computeCivicPoints } from '../lib/civicPoints'
import StatusBadge from './StatusBadge'
import AiTriageCard from './AiTriageCard'
import ReportLocationMap from './ReportLocationMap'
import ReportFeedbackForm from './ReportFeedbackForm'
import ReportEditForm from './ReportEditForm'
import FeedbackBadge from './FeedbackBadge'
import ResolutionProof from './ResolutionProof'
import CategoryIcon from './CategoryIcon'
import { IconMapPin, IconThumbsUp, IconX, IconEdit } from './Icons'

// A citizen can edit their own report while it's still waiting to be
// picked up -- once work has started (in_progress) or it's resolved, the
// details are locked to avoid changing the record out from under whoever
// is handling it. Client-side gate only, matching this app's existing
// prototype-grade auth caveats -- firestore.rules just checks authorship.
const EDITABLE_STATUSES = ['submitted', 'in_review']

/** Full-detail popup for a single report -- opened by clicking a
 * ReportCard. Not wrapped in AnimatePresence (mount-only entrance
 * animation, instant close) -- see the AnimatePresence+exit-tracking bug
 * class already fixed elsewhere in this app (Login.jsx, ReportFlow.jsx,
 * App.jsx) for why that combination is avoided here too. */
export default function ReportDetailModal({
  report,
  onClose,
  onUpvote,
  upvoted,
  showUpvote = true,
  initialEditing = false,
}) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const { submitReportFeedback, updateReport, reports } = useReports()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(() => initialEditing && user?.uid === report.createdBy && EDITABLE_STATUSES.includes(report.status))

  // Only the citizen who filed this report can rate it, and only once
  // it's resolved and they haven't already left feedback -- see
  // firestore.rules for the matching write restriction.
  const isOwner = Boolean(user && report.createdBy === user.uid)
  const needsFeedback =
    isOwner && report.status === 'resolved' && !report.citizenFeedback
  const canEdit = isOwner && EDITABLE_STATUSES.includes(report.status)

  async function handleFeedbackSubmit(feedback) {
    await submitReportFeedback(report.id, feedback)
    showToast(t('feedback.toast.submitted'))
  }

  async function handleEditSave(patch) {
    try {
      await updateReport(report.id, patch)
      showToast(t('toast.reportUpdated'))
      setEditing(false)
    } catch {
      showToast(t('toast.reportUpdateFailed'), 'error')
    }
  }

  function handleUpvoteClick() {
    onUpvote()
    showToast(upvoted ? t('toast.unupvoted') : t('toast.upvoted'))
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report))

  // Even though this renders through a portal (physically outside
  // ReportCard's DOM node), React dispatches its synthetic events along
  // the *component* tree, not the DOM tree -- so a click here would still
  // bubble up to ReportCard's own onClick (which opens this modal) unless
  // stopped. Without this, clicking the backdrop to close would
  // immediately reopen the modal via that bubbled event.
  function handleBackdropClick(e) {
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-card-hover"
      >
        <div className="flex items-start gap-3 border-b border-ink-100 p-5">
          <div className="shrink-0 overflow-hidden rounded-xl">
            <CategoryIcon category={report.category} className="h-11 w-11" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-ink-900">
              {typeLabel || report.type}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={report.status} />
            </div>
          </div>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={t('reportEdit.button')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700"
            >
              <IconEdit className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {editing ? (
            <ReportEditForm
              report={report}
              onSave={handleEditSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {report.photoUrls?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {report.photoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="h-28 w-28 shrink-0 rounded-xl border border-ink-200 object-cover"
                    />
                  ))}
                </div>
              )}

              <p className="text-sm leading-relaxed text-ink-700">
                {report.description}
              </p>

              {isOwner && !canEdit && (
                <p className="text-xs text-ink-400">
                  {t('reportEdit.unavailable')}
                </p>
              )}
            </>
          )}

          <AiTriageCard triage={report.aiTriage} />

          {!editing && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                <IconMapPin className="h-4 w-4 text-brand-700" />
                {report.location?.address ?? t('report.step2.coordinates')}
              </p>
              <ReportLocationMap location={report.location} />
            </div>
          )}

          {needsFeedback && (
            <ReportFeedbackForm onSubmit={handleFeedbackSubmit} />
          )}

          {report.citizenFeedback && (
            <div className="rounded-xl border border-ink-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {t('feedback.summary.heading')}
                </p>
                <FeedbackBadge feedback={report.citizenFeedback} />
              </div>
              {report.citizenFeedback.review && (
                <p className="mt-2 text-sm italic text-ink-600">
                  “{report.citizenFeedback.review}”
                </p>
              )}
            </div>
          )}

          <ResolutionProof proof={report.resolutionProof} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-xs text-ink-400">
            <div>
              <p className="font-mono">
                {t('admin.reportId', { id: report.id })}
              </p>
              {report.createdByName && (
                <p>{t('admin.reporter', { name: report.createdByName })}</p>
              )}
              {report.showCitizenBadge && <p className="mt-1 text-brand-700">{t('settings.publicBadge')}</p>}
              {report.showCivicRank && <p>{t('dashboard.mobile.points', { count: computeCivicPoints(reports.filter(r => r.createdBy === report.createdBy)) })}</p>}
              <p>
                {formatTimestamp(report.createdAt)} ·{' '}
                {timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </p>
            </div>

            {showUpvote && (
              <button
                type="button"
                onClick={handleUpvoteClick}
                aria-pressed={upvoted}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  upvoted
                    ? 'border-brand-600 bg-brand-800 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                <IconThumbsUp className="h-3.5 w-3.5" />
                {report.upvotes ?? 0}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
