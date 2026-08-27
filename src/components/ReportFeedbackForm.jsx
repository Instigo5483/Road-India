import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { StarRatingInput } from './StarRating'
import Button from './Button'

/** Shown inside ReportDetailModal to the report's own author once their
 * report is resolved and they haven't left feedback yet -- a 1-5 star
 * rating, a yes/no on whether it was actually resolved, and an optional
 * review. See ReportsContext.jsx's submitReportFeedback and
 * firestore.rules for how/why this is restricted to the real author. */
export default function ReportFeedbackForm({ onSubmit }) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(0)
  const [confirmedResolved, setConfirmedResolved] = useState(null)
  const [review, setReview] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = rating > 0 && confirmedResolved !== null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      await onSubmit({ rating, confirmedResolved, review: review.trim() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-ink-900">{t('feedback.title')}</p>
        <p className="mt-0.5 text-xs text-ink-500">{t('feedback.subtitle')}</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-700">{t('feedback.confirmLabel')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmedResolved(true)}
            aria-pressed={confirmedResolved === true}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              confirmedResolved === true
                ? 'border-success-600 bg-success-600 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {t('feedback.confirmYes')}
          </button>
          <button
            type="button"
            onClick={() => setConfirmedResolved(false)}
            aria-pressed={confirmedResolved === false}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              confirmedResolved === false
                ? 'border-emergency-600 bg-emergency-600 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {t('feedback.confirmNo')}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-700">{t('feedback.ratingLabel')}</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-700">
          {t('feedback.reviewLabel')} <span className="font-normal text-ink-400">({t('common.optional')})</span>
        </span>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={2}
          placeholder={t('feedback.reviewPlaceholder')}
          className="input-field resize-none text-sm"
        />
      </label>

      <Button type="submit" size="sm" loading={busy} disabled={!canSubmit}>
        {t('feedback.submit')}
      </Button>
    </form>
  )
}
