import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getTypesLabel, reportTypeIds } from '../data/categoryTypes'
import { formatDuration, timeAgo, toDate } from '../lib/time'
import { StarRatingDisplay } from './StarRating'
import ReportDetailModal from './ReportDetailModal'
import { IconArrowRight, IconCheckCircle, IconClock, IconMapPin, IconSparkle } from './Icons'

export default function ResolvedReportCard({ report, index = 0 }) {
  const { t, lang } = useLanguage()
  const [detailOpen, setDetailOpen] = useState(false)
  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report))
  const resolutionMs = report.resolvedAt
    ? toDate(report.resolvedAt).getTime() - toDate(report.createdAt).getTime()
    : null
  const photos = (report.photoUrls ?? []).filter(Boolean).slice(0, 2)
  const feedback = report.citizenFeedback

  function openDetails() {
    setDetailOpen(true)
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.3 }}
        onClick={openDetails}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openDetails()
          }
        }}
        role="button"
        tabIndex={0}
        className="group overflow-hidden rounded-2xl bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
              <IconCheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{typeLabel || t('category.issue.label')} · {t('status.resolved')}</span>
            </span>
            {resolutionMs != null && resolutionMs >= 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-500">
                <IconClock className="h-3 w-3" />
                {t('reports.resolvedIn', { duration: formatDuration(resolutionMs) })}
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[11px] font-bold text-brand-700">#{report.id}</span>
        </div>

        <h2 className="mt-3 font-display text-lg font-bold leading-snug text-ink-900 sm:text-xl">{report.description}</h2>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <IconMapPin className="h-4 w-4 shrink-0 text-accent-600" />
          <span className="truncate">{report.location?.address ?? report.location?.city ?? t('report.step2.coordinates')}</span>
          <span className="shrink-0">· {timeAgo(report.resolvedAt ?? report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
        </div>

        {photos.length > 0 && (
          <div className={`mt-4 grid overflow-hidden rounded-xl bg-ink-100 ${photos.length > 1 ? 'grid-cols-2 gap-1' : ''}`}>
            {photos.map((photo, photoIndex) => (
              <div key={`${photo.slice(0, 32)}-${photoIndex}`} className="relative h-36 sm:h-44">
                <img src={photo} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-ink-900/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">{t('resolved.evidence')}</span>
              </div>
            ))}
          </div>
        )}

        {report.aiTriage && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <IconSparkle className="h-4 w-4 shrink-0 text-brand-700" />
              <span className="truncate"><strong className="text-ink-800">{t('resolved.aiReviewed')}:</strong> {report.aiTriage.department}</span>
            </span>
            <IconCheckCircle className="h-4 w-4 shrink-0 text-success-600" />
          </div>
        )}

        <div className="mt-3 rounded-xl bg-ink-50 p-3">
          {feedback ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRatingDisplay rating={feedback.rating} className="h-4 w-4" />
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${feedback.confirmedResolved ? 'bg-success-100 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
                  <IconCheckCircle className="h-3 w-3" />
                  {feedback.confirmedResolved ? t('feedback.badge.confirmed') : t('feedback.badge.disputed')}
                </span>
              </div>
              {feedback.review && <p className="mt-2 text-sm leading-relaxed text-ink-700">“{feedback.review}”</p>}
            </>
          ) : (
            <p className="text-xs font-medium text-ink-500">{t('resolved.awaitingReview')}</p>
          )}
        </div>

        <button type="button" onClick={(event) => { event.stopPropagation(); openDetails() }} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-100 text-sm font-bold text-ink-800 transition-colors hover:bg-ink-200">
          {t('resolved.viewDetails')}
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.article>

      {detailOpen && <ReportDetailModal report={report} onClose={() => setDetailOpen(false)} showUpvote={false} />}
    </>
  )
}
