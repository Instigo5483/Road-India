import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getCategory, getType } from '../data/categoryTypes'
import { timeAgo, formatTimestamp } from '../lib/time'
import StatusBadge from './StatusBadge'
import EmergencyEtaBadge from './EmergencyEtaBadge'
import AiTriageCard from './AiTriageCard'
import ReportLocationMap from './ReportLocationMap'
import { IconPothole, IconSignpost, IconSiren, IconMapPin, IconThumbsUp, IconX } from './Icons'

const ICONS = { pothole: IconPothole, signpost: IconSignpost, siren: IconSiren }

const THEME_STYLES = {
  accent: 'bg-accent-500/10 text-accent-600',
  brand: 'bg-brand-600/10 text-brand-700',
  emergency: 'bg-emergency-500/10 text-emergency-600',
}

/** Full-detail popup for a single report -- opened by clicking a
 * ReportCard. Not wrapped in AnimatePresence (mount-only entrance
 * animation, instant close) -- see the AnimatePresence+exit-tracking bug
 * class already fixed elsewhere in this app (Login.jsx, ReportFlow.jsx,
 * App.jsx) for why that combination is avoided here too. */
export default function ReportDetailModal({ report, onClose, onUpvote, upvoted, showUpvote = true }) {
  const { t, lang } = useLanguage()

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

  const category = getCategory(report.category)
  const type = getType(report.category, report.type)
  const Icon = category ? ICONS[category.icon] : null

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
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              category ? THEME_STYLES[category.theme] : 'bg-ink-100 text-ink-500'
            }`}
          >
            {Icon && <Icon className="h-5.5 w-5.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-ink-900">{type ? t(type.labelKey) : report.type}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={report.status} />
              {report.category === 'emergency' && (
                <EmergencyEtaBadge createdAt={report.createdAt} etaMinutes={category?.etaMinutes} />
              )}
            </div>
          </div>
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

          <p className="text-sm leading-relaxed text-ink-700">{report.description}</p>

          <AiTriageCard triage={report.aiTriage} />

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700">
              <IconMapPin className="h-4 w-4 text-brand-700" />
              {report.location?.address ?? t('report.step2.coordinates')}
            </p>
            <ReportLocationMap location={report.location} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-xs text-ink-400">
            <div>
              {report.createdByName && <p>{t('admin.reporter', { name: report.createdByName })}</p>}
              <p>{formatTimestamp(report.createdAt)} · {timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}</p>
            </div>

            {showUpvote && (
              <button
                type="button"
                onClick={onUpvote}
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
