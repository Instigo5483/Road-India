import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getCategory, getType } from '../data/categoryTypes'
import { timeAgo } from '../lib/time'
import StatusBadge from './StatusBadge'
import EmergencyEtaBadge from './EmergencyEtaBadge'
import ReportDetailModal from './ReportDetailModal'
import { SEVERITY_THEME } from './AiTriageCard'
import { IconPothole, IconSignpost, IconSiren, IconMapPin, IconThumbsUp, IconSparkle } from './Icons'

const ICONS = { pothole: IconPothole, signpost: IconSignpost, siren: IconSiren }

const THEME_STYLES = {
  accent: 'bg-accent-500/10 text-accent-600',
  brand: 'bg-brand-600/10 text-brand-700',
  emergency: 'bg-emergency-500/10 text-emergency-600',
}

export default function ReportCard({
  report,
  distanceKm,
  onUpvote,
  upvoted = false,
  showUpvote = true,
  index = 0,
}) {
  const { t, lang } = useLanguage()
  const category = getCategory(report.category)
  const type = getType(report.category, report.type)
  const Icon = category ? ICONS[category.icon] : null
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.35 }}
      onClick={() => setDetailOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setDetailOpen(true)
        }
      }}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:flex-row sm:items-start sm:gap-4 sm:p-5"
    >
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
          category ? THEME_STYLES[category.theme] : 'bg-ink-100 text-ink-500'
        }`}
      >
        {Icon && <Icon className="h-5.5 w-5.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink-900">{type ? t(type.labelKey) : report.type}</h3>
          <StatusBadge status={report.status} />
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
          {report.category === 'emergency' && (
            <>
              <span className="rounded-full bg-emergency-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emergency-600">
                {t('category.emergency.label')}
              </span>
              <EmergencyEtaBadge createdAt={report.createdAt} etaMinutes={category.etaMinutes} />
            </>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">
          {report.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <IconMapPin className="h-3.5 w-3.5" />
            {report.location?.address ?? t('report.step2.coordinates')}
          </span>
          <span>{timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
          {typeof distanceKm === 'number' && isFinite(distanceKm) && (
            <span className="font-medium text-brand-600">
              {t('reports.distanceAway', { distance: distanceKm.toFixed(1) })}
            </span>
          )}
          {report.assignedTeams?.length > 0 && (
            <span className="font-medium text-emergency-600">
              {t('reports.dispatched', {
                teams: report.assignedTeams.map((a) => a.teamName).join(', '),
              })}
            </span>
          )}
        </div>
      </div>

      {showUpvote && (
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpvote()
          }}
          whileTap={{ scale: 0.9 }}
          aria-label={t('reports.upvoteCount', { count: report.upvotes ?? 0 })}
          aria-pressed={upvoted}
          className={`flex shrink-0 flex-col items-center gap-1 self-stretch rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors sm:self-center ${
            upvoted
              ? 'border-brand-600 bg-brand-800 text-white'
              : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
          }`}
        >
          <motion.span
            key={upvoted ? 'up' : 'down'}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <IconThumbsUp className="h-4 w-4" />
          </motion.span>
          <span>{report.upvotes ?? 0}</span>
          <span className="text-[11px] font-medium text-current opacity-70">
            {upvoted ? t('reports.upvoted') : t('reports.upvote')}
          </span>
        </motion.button>
      )}

      {detailOpen && (
        <ReportDetailModal
          report={report}
          onClose={() => setDetailOpen(false)}
          onUpvote={onUpvote}
          upvoted={upvoted}
          showUpvote={showUpvote}
        />
      )}
    </motion.div>
  )
}
