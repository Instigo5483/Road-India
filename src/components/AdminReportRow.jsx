import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getCategory, getType, STATUSES } from '../data/categoryTypes'
import { timeAgo } from '../lib/time'
import { SEVERITY_THEME } from './AiTriageCard'
import { IconPothole, IconSignpost, IconSiren, IconMapPin, IconSparkle, IconThumbsUp } from './Icons'

const ICONS = { pothole: IconPothole, signpost: IconSignpost, siren: IconSiren }

const THEME_STYLES = {
  accent: 'bg-accent-500/10 text-accent-600',
  brand: 'bg-brand-600/10 text-brand-700',
  emergency: 'bg-emergency-500/10 text-emergency-600',
}

export default function AdminReportRow({ report, onStatusChange, index = 0 }) {
  const { t, lang } = useLanguage()
  const [updating, setUpdating] = useState(false)
  const category = getCategory(report.category)
  const type = getType(report.category, report.type)
  const Icon = category ? ICONS[category.icon] : null

  async function handleStatusChange(e) {
    const status = e.target.value
    setUpdating(true)
    try {
      await onStatusChange(report.id, status)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
      className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            category ? THEME_STYLES[category.theme] : 'bg-ink-100 text-ink-500'
          }`}
        >
          {Icon && <Icon className="h-5.5 w-5.5" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink-900">{type ? t(type.labelKey) : report.type}</h3>
            {category && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                {t(category.labelKey)}
              </span>
            )}
            {report.aiTriage?.severity && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  SEVERITY_THEME[report.aiTriage.severity] ?? SEVERITY_THEME.medium
                }`}
              >
                <IconSparkle className="h-2.5 w-2.5" />
                {t(`severity.${report.aiTriage.severity}`)}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{report.description}</p>

          {report.aiTriage?.department && (
            <p className="mt-1.5 text-xs font-medium text-ink-400">
              {t('report.aiTriage.routedTo', { department: report.aiTriage.department })}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1">
              <IconMapPin className="h-3.5 w-3.5" />
              {report.location?.address ?? t('report.step2.coordinates')}
            </span>
            <span>{timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
            {report.createdByName && <span>{t('admin.reporter', { name: report.createdByName })}</span>}
            <span className="inline-flex items-center gap-1">
              <IconThumbsUp className="h-3 w-3" />
              {report.upvotes ?? 0}
            </span>
          </div>
        </div>

        <label className="flex shrink-0 flex-col gap-1">
          <span className="text-[11px] font-medium text-ink-400">{t('admin.status.updateLabel')}</span>
          <select
            value={report.status}
            onChange={handleStatusChange}
            disabled={updating}
            className="input-field w-auto min-w-[9rem] py-2 text-sm disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {t(s.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </motion.div>
  )
}
