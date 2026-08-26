import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES, STATUSES } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import { db, isFirebaseConfigured } from '../lib/firebase'
import AdminReportRow from '../components/AdminReportRow'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Logo from '../components/Logo'
import FilterDropdown from '../components/FilterDropdown'
import {
  IconLogOut,
  IconSiren,
  IconClock,
  IconListChecks,
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconX,
} from '../components/Icons'

export default function Admin() {
  const { logoutAdmin } = useAdminAuth()
  const { reports, updateReportStatus } = useReports()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [teams, setTeams] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const stats = useMemo(
    () => ({
      total: reports.length,
      emergencies: reports.filter((r) => r.category === 'emergency' && r.status !== 'resolved').length,
      unresolved: reports.filter((r) => r.status !== 'resolved').length,
    }),
    [reports]
  )

  // Cascading location filter options, derived straight from the current
  // reports -- same pattern as the citizen Ongoing Reports feed (see
  // lib/reportFilters.js).
  const stateOptions = useMemo(() => uniqueValues(reports, 'state'), [reports])
  const districtOptions = useMemo(
    () => uniqueValues(reports, 'district', (r) => stateFilter === 'all' || r.location?.state === stateFilter),
    [reports, stateFilter]
  )
  const cityOptions = useMemo(
    () =>
      uniqueValues(
        reports,
        'city',
        (r) =>
          (stateFilter === 'all' || r.location?.state === stateFilter) &&
          (districtFilter === 'all' || r.location?.district === districtFilter)
      ),
    [reports, stateFilter, districtFilter]
  )

  function handleStateChange(value) {
    setStateFilter(value)
    setDistrictFilter('all')
    setCityFilter('all')
  }

  function handleDistrictChange(value) {
    setDistrictFilter(value)
    setCityFilter('all')
  }

  const timeOptions = useMemo(() => TIME_RANGES.map((r) => ({ value: r.id, label: t(r.key) })), [t])
  const stateDropdownOptions = useMemo(
    () => [{ value: 'all', label: t('reports.filter.allStates') }, ...stateOptions.map((s) => ({ value: s, label: s }))],
    [stateOptions, t]
  )
  const districtDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allDistricts') },
      ...districtOptions.map((d) => ({ value: d, label: d })),
    ],
    [districtOptions, t]
  )
  const cityDropdownOptions = useMemo(
    () => [{ value: 'all', label: t('reports.filter.allCities') }, ...cityOptions.map((c) => ({ value: c, label: c }))],
    [cityOptions, t]
  )

  const activeFilterCount = [timeFilter, stateFilter, districtFilter, cityFilter].filter((v) => v !== 'all').length

  const hasAnyFilter =
    activeFilterCount > 0 || categoryFilter !== 'all' || statusFilter !== 'all' || search.trim() !== ''

  function clearAllFilters() {
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setTimeFilter('all')
    setStateFilter('all')
    setDistrictFilter('all')
    setCityFilter('all')
  }

  const filtered = useMemo(() => {
    let list = reports
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location?.address?.toLowerCase().includes(q) ||
          r.createdByName?.toLowerCase().includes(q)
      )
    }

    if (stateFilter !== 'all') list = list.filter((r) => r.location?.state === stateFilter)
    if (districtFilter !== 'all') list = list.filter((r) => r.location?.district === districtFilter)
    if (cityFilter !== 'all') list = list.filter((r) => r.location?.city === cityFilter)

    const range = TIME_RANGES.find((r) => r.id === timeFilter)
    if (range?.ms) {
      const cutoff = Date.now() - range.ms
      list = list.filter((r) => toDate(r.createdAt).getTime() >= cutoff)
    }

    return [...list].sort((a, b) => {
      const emergencyDelta = (b.category === 'emergency') - (a.category === 'emergency')
      if (emergencyDelta !== 0) return emergencyDelta
      return toDate(b.createdAt) - toDate(a.createdAt)
    })
  }, [reports, categoryFilter, statusFilter, search, stateFilter, districtFilter, cityFilter, timeFilter])

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
            <Logo className="h-9 w-9" />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="mt-1.5 text-ink-500">{t('admin.subtitle')}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/teams')}>
            {t('admin.teams.heading')}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile icon={IconListChecks} label={t('admin.stats.total')} value={stats.total} theme="brand" />
          <StatTile icon={IconSiren} label={t('admin.stats.emergencies')} value={stats.emergencies} theme="emergency" />
          <StatTile icon={IconClock} label={t('admin.stats.unresolved')} value={stats.unresolved} theme="accent" />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2.5 shadow-card">
          <IconSearch className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchPlaceholder')}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400 transition-colors hover:text-brand-700"
          >
            <IconFilter className="h-3.5 w-3.5" />
            {t('reports.filter.heading')}
            {activeFilterCount > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-800 text-[10px] font-bold normal-case text-white">
                {activeFilterCount}
              </span>
            )}
            <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              <IconX className="h-3 w-3" />
              {t('reports.filter.clearAll')}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-visible"
            >
              <div className="flex flex-wrap gap-2 pt-2.5">
                <FilterDropdown label={t('reports.filter.time')} value={timeFilter} onChange={setTimeFilter} options={timeOptions} />
                <FilterDropdown
                  label={t('reports.filter.state')}
                  value={stateFilter}
                  onChange={handleStateChange}
                  options={stateDropdownOptions}
                />
                <FilterDropdown
                  label={t('reports.filter.district')}
                  value={districtFilter}
                  onChange={handleDistrictChange}
                  options={districtDropdownOptions}
                  disabled={districtOptions.length === 0}
                />
                <FilterDropdown
                  label={t('reports.filter.city')}
                  value={cityFilter}
                  onChange={setCityFilter}
                  options={cityDropdownOptions}
                  disabled={cityOptions.length === 0}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-3">
          {filtered.map((report, i) => (
            <AdminReportRow
              key={report.id}
              report={report}
              onStatusChange={updateReportStatus}
              teams={teams}
              index={i}
            />
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
