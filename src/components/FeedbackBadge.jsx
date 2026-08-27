import { useLanguage } from '../context/LanguageContext'
import { StarRatingDisplay } from './StarRating'

/** Compact "citizen confirmed/disputed resolution" summary shown on report
 * rows (ReportCard, AdminReportRow) once the reporter has left feedback --
 * see ReportDetailModal.jsx for the fuller version with the review text. */
export default function FeedbackBadge({ feedback }) {
  const { t } = useLanguage()
  if (!feedback) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          feedback.confirmedResolved ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-600'
        }`}
      >
        {feedback.confirmedResolved ? t('feedback.badge.confirmed') : t('feedback.badge.disputed')}
      </span>
      <StarRatingDisplay rating={feedback.rating} className="h-3 w-3" />
    </span>
  )
}
