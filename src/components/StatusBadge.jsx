import { useLanguage } from '../context/LanguageContext'
import { getStatus } from '../data/categoryTypes'

const DOT_STYLES = {
  ink: 'bg-ink-400',
  warning: 'bg-warning-500',
  brand: 'bg-brand-600',
  success: 'bg-success-500',
}

const BADGE_STYLES = {
  ink: 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300',
  warning: 'bg-warning-50 text-warning-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-700',
}

export default function StatusBadge({ status, className = '' }) {
  const { t } = useLanguage()
  const info = getStatus(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_STYLES[info.theme]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[info.theme]}`} />
      {t(info.labelKey)}
    </span>
  )
}
