import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES, STATUSES } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import AdminReportRow from '../components/AdminReportRow'
import EmptyState from '../components/EmptyState'
import { IconLogOut, IconSiren, IconClock, IconListChecks } from '../components/Icons'

export default function Admin() {
  const { logoutAdmin } = useAdminAuth()
  const { reports, updateReportStatus } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(
    () => ({
      total: reports.length,
      emergencies: reports.filter((r) => r.category === 'emergency' && r.status !== 'resolved').length,
      unresolved: reports.filter((r) => r.status !== 'resolved').length,
    }),
    [reports]
  )

  const filtered = useMemo(() => {
    let list = reports
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    return [...list].sort((a, b) => {
      const emergencyDelta = (b.category === 'emergency') - (a.category === 'emergency')
      if (emergencyDelta !== 0) return emergencyDelta
      return toDate(b.createdAt) - toDate(a.createdAt)
    })
  }, [reports, categoryFilter, statusFilter])

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  const categoryChips = [{ id: 'all', label: t('admin.filter.all') }, ...CATEGORIES.map((c) => ({ id: c.id, label: t(c.labelKey) }))]
  const statusChips = [{ id: 'all', label: t('admin.filter.status.all') }, ...STATUSES.map((s) => ({ id: s.id, label: t(s.labelKey) }))]

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-800 text-sm text-white">
              RI
            </span>
            {t('common.appName')}
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-emergency-300 hover:text-emergency-600"
          >
            <IconLogOut className="h-4 w-4" />
            {t('admin.logout')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-ink-900 sm:text-3xl"
        >
          {t('admin.title')}
        </motion.h1>
        <p className="mt-1.5 text-ink-500">{t('admin.subtitle')}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile icon={IconListChecks} label={t('admin.stats.total')} value={stats.total} theme="brand" />
          <StatTile icon={IconSiren} label={t('admin.stats.emergencies')} value={stats.emergencies} theme="emergency" />
          <StatTile icon={IconClock} label={t('admin.stats.unresolved')} value={stats.unresolved} theme="accent" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {categoryChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategoryFilter(chip.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === chip.id
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {statusChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === chip.id ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((report, i) => (
            <AdminReportRow key={report.id} report={report} onStatusChange={updateReportStatus} index={i} />
          ))}

          {filtered.length === 0 && <EmptyState title={t('admin.empty.title')} />}
        </div>
      </main>
    </div>
  )
}

const STAT_THEME = {
  brand: 'bg-brand-600/10 text-brand-700',
  emergency: 'bg-emergency-500/10 text-emergency-600',
  accent: 'bg-accent-500/10 text-accent-600',
}

function StatTile({ icon: Icon, label, value, theme }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${STAT_THEME[theme]}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-2.5 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  )
}
