import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getCategory, reportTypeIds, getTypesLabel, STATUSES } from '../data/categoryTypes'
import { getTeamType, getTeamStatus, getRequiredTeamTypesForReport } from '../data/teamTypes'
import { timeAgo } from '../lib/time'
import { isFirebaseConfigured } from '../lib/firebase'
import { reassignReportTeam } from '../lib/teams'
import { SEVERITY_THEME } from './AiTriageCard'
import ReportDetailModal from './ReportDetailModal'
import { IconPothole, IconSignpost, IconSiren, IconMapPin, IconSparkle, IconThumbsUp } from './Icons'

const ICONS = { pothole: IconPothole, signpost: IconSignpost, siren: IconSiren }

const THEME_STYLES = {
  accent: 'bg-accent-500/10 text-accent-600',
  brand: 'bg-brand-600/10 text-brand-700',
  emergency: 'bg-emergency-500/10 text-emergency-600',
}

export default function AdminReportRow({ report, onStatusChange, teams = [], index = 0 }) {
  const { t, lang } = useLanguage()
  const [updating, setUpdating] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [reassigningType, setReassigningType] = useState('')
  const category = getCategory(report.category)
  const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report))
  const Icon = category ? ICONS[category.icon] : null

  const isEmergency = report.category === 'emergency'
  const requiredTeamTypes = isEmergency ? getRequiredTeamTypesForReport(report) : []

  async function handleStatusChange(e) {
    const status = e.target.value
    setUpdating(true)
    try {
      await onStatusChange(report.id, status)
    } finally {
      setUpdating(false)
    }
  }

  async function handleReassign(teamType, newTeamId) {
    setReassigningType(teamType)
    try {
      await reassignReportTeam(report, teamType, newTeamId || null)
    } finally {
      setReassigningType('')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
      onClick={() => setDetailOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setDetailOpen(true)
        }
      }}
      className="cursor-pointer rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-5"
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
            <h3 className="font-semibold text-ink-900">{typeLabel || report.type}</h3>
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

        <label className="flex shrink-0 flex-col gap-1" onClick={(e) => e.stopPropagation()}>
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

      {isEmergency && isFirebaseConfigured && requiredTeamTypes.length > 0 && (
        <div
          className="mt-3 space-y-2 border-t border-ink-100 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-ink-500">{t('admin.assignedTeams.heading')}</p>
          {requiredTeamTypes.map((teamType) => {
            const assigned = report.assignedTeams?.find((a) => a.teamType === teamType)
            const options = teams.filter((tm) => tm.type === teamType)
            const teamTypeMeta = getTeamType(teamType)
            return (
              <div key={teamType} className="flex items-center justify-between gap-3">
                <span className="text-xs text-ink-500">
                  {teamTypeMeta ? t(teamTypeMeta.labelKey) : teamType}
                </span>
                <select
                  value={assigned?.teamId ?? ''}
                  disabled={reassigningType === teamType}
                  onChange={(e) => handleReassign(teamType, e.target.value)}
                  className="input-field w-auto min-w-[11rem] py-1.5 text-xs disabled:opacity-60"
                >
                  <option value="">{t('admin.assignedTeams.unassigned')}</option>
                  {options.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} · {t(getTeamStatus(tm.status).labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      {detailOpen && (
        <ReportDetailModal report={report} onClose={() => setDetailOpen(false)} showUpvote={false} />
      )}
    </motion.div>
  )
}
