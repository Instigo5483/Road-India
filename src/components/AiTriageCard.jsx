import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { IconSparkle, IconCamera } from './Icons'

export const SEVERITY_THEME = {
  low: 'bg-success-50 text-success-700',
  medium: 'bg-warning-50 text-warning-600',
  high: 'bg-accent-50 text-accent-700',
  critical: 'bg-emergency-50 text-emergency-600',
}

/** Full AI-triage summary shown right after a report is filed -- severity,
 * the department it was routed to, and the model's one-line caseworker
 * summary. See components/ReportCard.jsx's compact AiTriageBadge for the
 * feed/dashboard equivalent. */
export default function AiTriageCard({ triage }) {
  const { t } = useLanguage()
  if (!triage) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full rounded-xl border border-ink-200 bg-white p-4 text-left"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-700">
          <IconSparkle className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {t('report.aiTriage.heading')}
        </p>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${SEVERITY_THEME[triage.severity] ?? SEVERITY_THEME.medium}`}
        >
          {t(`severity.${triage.severity}`)}
        </span>
      </div>
      <p className="mt-2.5 text-sm text-ink-700">{triage.summary}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs font-medium text-ink-400">
          {t('report.aiTriage.routedTo', { department: triage.department })}
        </p>
        {triage.photoAnalyzed && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
            <IconCamera className="h-3 w-3" />
            {t('report.aiTriage.photoAnalyzed')}
          </span>
        )}
      </div>
    </motion.div>
  )
}
