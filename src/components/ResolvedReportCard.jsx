import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getCategory, getTypesLabel, reportTypeIds } from '../data/categoryTypes'
import { formatDuration, timeAgo, toDate } from '../lib/time'
import CategoryIcon from './CategoryIcon'
import FeedbackBadge from './FeedbackBadge'
import ReportDetailModal from './ReportDetailModal'
import StatusBadge from './StatusBadge'
import {
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconMapPin,
  IconSparkle,
  IconStar,
} from './Icons'

const CATEGORY_STYLE = {
  problem: {
    spine: 'border-l-accent-500',
    chip: 'bg-accent-50 text-accent-700',
    proof: 'border-accent-100 bg-accent-50/50',
  },
  corruption: {
    spine: 'border-l-brand-600',
    chip: 'bg-brand-50 text-brand-700',
    proof: 'border-brand-100 bg-brand-50/50',
  },
}

/** Archive-specific report presentation based on the Stitch resolved-case
 * layout. It deliberately keeps the existing shared detail modal, so the
 * redesign cannot lose photos, AI triage, feedback, or the exact map pin. */
export default function ResolvedReportCard({ report, index = 0 }) {
  const { t, lang } = useLanguage()
  const [detailOpen, setDetailOpen] = useState(false)
  const category = getCategory(report.category)
  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report))
  const style = CATEGORY_STYLE[report.category] ?? CATEGORY_STYLE.problem
  const resolutionMs = report.resolvedAt
    ? toDate(report.resolvedAt).getTime() - toDate(report.createdAt).getTime()
    : null

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
        className={`group overflow-hidden rounded-xl border border-l-4 border-ink-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${style.spine}`}
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2.5 py-1 text-xs font-bold ${style.chip}`}>
                {category ? t(category.labelKey) : report.category}
                {typeLabel ? ` · ${typeLabel}` : ''}
              </span>
              <StatusBadge status={report.status} />
              <span className="font-mono text-[11px] font-semibold text-ink-400">
                {t('admin.reportId', { id: report.id })}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <CategoryIcon category={report.category} className="h-11 w-11 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold leading-snug text-ink-900 sm:text-xl">
                  {typeLabel || report.type}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">
                  {report.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <IconMapPin className="h-3.5 w-3.5 text-brand-600" />
                {report.location?.address ?? t('report.step2.coordinates')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconClock className="h-3.5 w-3.5" />
                {timeAgo(report.resolvedAt ?? report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </span>
              {resolutionMs != null && resolutionMs >= 0 && (
                <span className="font-semibold text-success-700">
                  {t('reports.resolvedIn', { duration: formatDuration(resolutionMs) })}
                </span>
              )}
            </div>

            <div className={`mt-5 rounded-lg border p-3.5 ${style.proof}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
                  <IconCheckCircle className="h-4 w-4 text-success-600" />
                  {t('resolved.recordVerified')}
                </div>
                {report.aiTriage?.department && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                    <IconSparkle className="h-3.5 w-3.5" />
                    {t('report.aiTriage.routedTo', {
                      department: report.aiTriage.department,
                    })}
                  </span>
                )}
              </div>
              {report.citizenFeedback && (
                <div className="mt-2">
                  <FeedbackBadge feedback={report.citizenFeedback} />
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col justify-between border-t border-ink-100 bg-ink-50 p-5 lg:border-l lg:border-t-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                {t('resolved.citizenReview')}
              </p>
              {typeof report.citizenFeedback?.rating === 'number' ? (
                <>
                  <div className="mt-3 flex items-end gap-1.5">
                    <IconStar className="mb-1 h-5 w-5 fill-accent-500 text-accent-500" />
                    <span className="font-display text-3xl font-bold text-ink-900">
                      {report.citizenFeedback.rating.toFixed(1)}
                    </span>
                    <span className="mb-1 text-xs text-ink-400">/ 5</span>
                  </div>
                  {report.citizenFeedback.review && (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">
                      “{report.citizenFeedback.review}”
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm font-medium text-ink-500">
                  {t('resolved.awaitingReview')}
                </p>
              )}
            </div>

            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
              {t('resolved.viewDetails')}
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </aside>
        </div>
      </motion.article>

      {detailOpen && (
        <ReportDetailModal
          report={report}
          onClose={() => setDetailOpen(false)}
          showUpvote={false}
        />
      )}
    </>
  )
}
