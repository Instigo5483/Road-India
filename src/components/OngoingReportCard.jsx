import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { getTypesLabel, reportTypeIds } from '../data/categoryTypes'
import { timeAgo } from '../lib/time'
import StatusBadge from './StatusBadge'
import ReportDetailModal from './ReportDetailModal'
import {
  IconArrowRight,
  IconCamera,
  IconMapPin,
  IconSparkle,
  IconThumbsUp,
} from './Icons'

const STATUS_PROGRESS = {
  submitted: 25,
  in_review: 55,
  in_progress: 80,
}

export default function OngoingReportCard({
  report,
  distanceKm,
  onUpvote,
  upvoted = false,
  canUpvote = false,
  index = 0,
}) {
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [detailOpen, setDetailOpen] = useState(false)
  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report)) || report.type
  const photos = report.photoUrls ?? []
  const severity = report.aiTriage?.severity
  const progress = STATUS_PROGRESS[report.status] ?? 15

  function openDetails() {
    setDetailOpen(true)
  }

  function handleUpvote(event) {
    event.stopPropagation()
    onUpvote()
    if (canUpvote) showToast(upvoted ? t('toast.unupvoted') : t('toast.upvoted'))
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.28 }}
        onClick={openDetails}
        className="cursor-pointer rounded-xl border border-ink-100 bg-white p-3 shadow-card transition-shadow hover:shadow-card-hover sm:p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="max-w-full truncate rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-bold text-accent-800">
              {typeLabel}
            </span>
            <span className="max-w-40 truncate font-mono text-[11px] text-ink-400">#{report.id}</span>
          </div>
          <span className="shrink-0 text-[11px] text-ink-400">
            {timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}
          </span>
        </div>

        <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug text-ink-900 sm:text-xl">
          {report.description}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
          <IconMapPin className="h-4 w-4 shrink-0 text-accent-600" />
          <span className="max-w-full truncate">{report.location?.address ?? t('report.step2.coordinates')}</span>
          {typeof distanceKm === 'number' && Number.isFinite(distanceKm) && (
            <>
              <span className="text-ink-300">•</span>
              <span className="font-semibold text-ink-700">{t('reports.distanceAway', { distance: distanceKm.toFixed(1) })}</span>
            </>
          )}
        </div>

        {photos.length > 0 && (
          <div className="relative mt-3 h-44 overflow-hidden rounded-lg bg-ink-100 sm:h-56">
            <img src={photos[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
            {severity && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-ink-950/85 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                <IconSparkle className="h-3.5 w-3.5 text-accent-300" />
                {t('reports.aiSeverity', { severity: t(`severity.${severity}`) })}
              </span>
            )}
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-ink-700 backdrop-blur">
              <IconCamera className="h-3 w-3" />
              {t('reports.photos', { count: photos.length })}
            </span>
          </div>
        )}

        <div className="mt-3 rounded-lg bg-ink-50 p-2.5">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={report.status} />
            {report.aiTriage?.department && (
              <span className="truncate text-[11px] font-medium text-ink-500">{report.aiTriage.department}</span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="h-full rounded-full bg-accent-500" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleUpvote}
            aria-pressed={upvoted}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
              upvoted ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            <IconThumbsUp className="h-4 w-4" />
            {t('reports.upvoteCount', { count: report.upvotes ?? 0 })}
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); openDetails() }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-700">
            {t('reports.details')}
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.article>

      {detailOpen && (
        <ReportDetailModal
          report={report}
          onClose={() => setDetailOpen(false)}
          onUpvote={onUpvote}
          upvoted={upvoted}
          showUpvote={canUpvote}
        />
      )}
    </>
  )
}
