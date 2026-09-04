import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import ResolvedReportCard from '../components/ResolvedReportCard'
import EmptyState from '../components/EmptyState'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { toDate, formatDuration } from '../lib/time'
import { CATEGORIES } from '../data/categoryTypes'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import FilterDropdown from '../components/FilterDropdown'
import {
  IconCheckCircle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
  IconStar,
  IconClock,
  IconShieldCheck,
  IconX,
} from '../components/Icons'

const PAGE_SIZE = 5

const SORTS = [
  { id: 'recent', key: 'resolved.sort.recent' },
  { id: 'fastest', key: 'resolved.sort.fastest' },
  { id: 'upvoted', key: 'resolved.sort.upvoted' },
  { id: 'rating', key: 'resolved.sort.rating' },
]

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="mt-1 truncate font-display text-2xl font-bold text-ink-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
      </div>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  )
}

/** A public accountability feed: anyone can inspect completed work without
 * creating an account. ReportCard still exposes its full details/map modal. */
export default function ResolvedReports() {
  const { reports } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  // Citywide totals -- deliberately computed from *every* resolved report,
  // not just the ones matching the current search/filters, so the top
  // stats read as a stable public record rather than jumping around as
  // someone types in the search box.
  const resolvedForStats = useMemo(
    () => reports.filter((report) => report.status === 'resolved'),
    [reports]
  )

  const categoryCounts = useMemo(() => {
    const counts = { all: resolvedForStats.length }
    CATEGORIES.forEach((category) => {
      counts[category.id] = resolvedForStats.filter(
        (report) => report.category === category.id
      ).length
    })
    return counts
  }, [resolvedForStats])

  const ratingStats = useMemo(() => {
    const rated = resolvedForStats.filter(
      (report) => typeof report.citizenFeedback?.rating === 'number'
    )
    if (!rated.length) return { avg: null, count: 0 }
    const avg = rated.reduce((sum, report) => sum + report.citizenFeedback.rating, 0) / rated.length
    return { avg, count: rated.length }
  }, [resolvedForStats])

  const avgResolutionMs = useMemo(() => {
    const withResolvedAt = resolvedForStats.filter((report) => report.resolvedAt)
    if (!withResolvedAt.length) return null
    const total = withResolvedAt.reduce(
      (sum, report) =>
        sum + (toDate(report.resolvedAt).getTime() - toDate(report.createdAt).getTime()),
      0
    )
    return total / withResolvedAt.length
  }, [resolvedForStats])

  const stateOptions = useMemo(
    () => uniqueValues(reports, 'state', (report) => report.status === 'resolved'),
    [reports]
  )
  const districtOptions = useMemo(
    () =>
      uniqueValues(
        reports,
        'district',
        (report) =>
          report.status === 'resolved' &&
          (stateFilter === 'all' || report.location?.state === stateFilter)
      ),
    [reports, stateFilter]
  )
  const cityOptions = useMemo(
    () =>
      uniqueValues(
        reports,
        'city',
        (report) =>
          report.status === 'resolved' &&
          (stateFilter === 'all' || report.location?.state === stateFilter) &&
          (districtFilter === 'all' || report.location?.district === districtFilter)
      ),
    [reports, stateFilter, districtFilter]
  )
  const timeOptions = useMemo(
    () => TIME_RANGES.map((range) => ({ value: range.id, label: t(range.key) })),
    [t]
  )
  const stateDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allStates') },
      ...stateOptions.map((value) => ({ value, label: value })),
    ],
    [stateOptions, t]
  )
  const districtDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allDistricts') },
      ...districtOptions.map((value) => ({ value, label: value })),
    ],
    [districtOptions, t]
  )
  const cityDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allCities') },
      ...cityOptions.map((value) => ({ value, label: value })),
    ],
    [cityOptions, t]
  )

  const activeFilterCount = [timeFilter, stateFilter, districtFilter, cityFilter].filter(
    (value) => value !== 'all'
  ).length
  const hasAnyFilter =
    activeFilterCount > 0 || categoryFilter !== 'all' || search.trim() !== ''

  function handleStateChange(value) {
    setStateFilter(value)
    setDistrictFilter('all')
    setCityFilter('all')
  }

  function handleDistrictChange(value) {
    setDistrictFilter(value)
    setCityFilter('all')
  }

  function clearAllFilters() {
    setSearch('')
    setCategoryFilter('all')
    setTimeFilter('all')
    setStateFilter('all')
    setDistrictFilter('all')
    setCityFilter('all')
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reports
      .filter((report) => report.status === 'resolved')
      .filter(
        (report) => categoryFilter === 'all' || report.category === categoryFilter
      )
      .filter((report) => {
        if (!query) return true
        return [
          report.id,
          report.description,
          report.location?.address,
          report.location?.city,
          report.location?.state,
        ].some((value) => value?.toLowerCase().includes(query))
      })
      .filter(
        (report) => stateFilter === 'all' || report.location?.state === stateFilter
      )
      .filter(
        (report) =>
          districtFilter === 'all' || report.location?.district === districtFilter
      )
      .filter((report) => cityFilter === 'all' || report.location?.city === cityFilter)
      .filter((report) => {
        const range = TIME_RANGES.find((item) => item.id === timeFilter)
        return !range?.ms || toDate(report.createdAt).getTime() >= Date.now() - range.ms
      })
  }, [
    reports,
    search,
    categoryFilter,
    stateFilter,
    districtFilter,
    cityFilter,
    timeFilter,
  ])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'fastest') {
      list.sort((a, b) => {
        const durationA = a.resolvedAt
          ? toDate(a.resolvedAt).getTime() - toDate(a.createdAt).getTime()
          : Infinity
        const durationB = b.resolvedAt
          ? toDate(b.resolvedAt).getTime() - toDate(b.createdAt).getTime()
          : Infinity
        return durationA - durationB
      })
    } else if (sort === 'upvoted') {
      list.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
    } else if (sort === 'rating') {
      list.sort(
        (a, b) => (b.citizenFeedback?.rating ?? -1) - (a.citizenFeedback?.rating ?? -1)
      )
    } else {
      list.sort(
        (a, b) => toDate(b.resolvedAt ?? b.createdAt) - toDate(a.resolvedAt ?? a.createdAt)
      )
    }
    return list
  }, [filtered, sort])

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, timeFilter, stateFilter, districtFilter, cityFilter, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(
    () => sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [sorted, pageSafe]
  )

  const categoryChips = [{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES]

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(user ? '/home' : '/')}
            className="flex shrink-0 items-center gap-2.5 text-left"
          >
            <Logo className="h-10 w-10" />
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-bold leading-none text-ink-900">
                {t('common.appName')}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-ink-500">
                {t('resolved.portalSubtitle')}
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 rounded-xl bg-ink-100 p-1 lg:flex">
            {[
              [t('nav.home'), user ? '/home' : '/'],
              [t('nav.reports'), user ? '/reports' : '/login'],
              [t('nav.resolved'), '/resolved'],
              [t('nav.data'), '/data'],
              [t('nav.dashboard'), user ? '/dashboard' : '/login'],
            ].map(([label, path]) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  path === '/resolved'
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-white hover:text-ink-900'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSelector variant="neutral" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(user ? '/home' : '/login')}
            >
              {user ? t('nav.home') : t('landing.nav.login')}
            </Button>
          </div>
        </div>
      </header>

      <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-5 border-b border-ink-200 pb-5 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent-700">
              <IconCheckCircle className="h-4 w-4" />
              {t('resolved.eyebrow')}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t('resolved.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-ink-500">{t('resolved.subtitle')}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-100 px-3 py-2 text-xs font-semibold text-ink-600 shadow-sm">
            <IconShieldCheck className="h-4 w-4 text-success-600" />
            {t('resolved.liveData')}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={IconCheckCircle}
            label={t('resolved.stats.remediated')}
            value={resolvedForStats.length.toLocaleString()}
            color="bg-success-50 text-success-600"
          />
          <StatCard
            icon={IconStar}
            label={t('resolved.stats.rating')}
            value={ratingStats.avg != null ? ratingStats.avg.toFixed(1) : '—'}
            sub={
              ratingStats.count > 0
                ? t('resolved.stats.ratingCount', { count: ratingStats.count })
                : t('resolved.stats.ratingEmpty')
            }
            color="bg-accent-50 text-accent-600"
          />
          <StatCard
            icon={IconClock}
            label={t('resolved.stats.avgResolution')}
            value={avgResolutionMs != null ? formatDuration(avgResolutionMs) : '—'}
            sub={avgResolutionMs == null ? t('resolved.stats.avgResolutionEmpty') : undefined}
            color="bg-brand-50 text-brand-700"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-4 py-2.5">
            <IconSearch className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('resolved.searchPlaceholder')}
              className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
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
                {t('reports.filter.categoryCount', {
                  label: t(chip.labelKey),
                  count: categoryCounts[chip.id] ?? 0,
                })}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
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
              <IconChevronDown
                className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              />
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
                  <FilterDropdown
                    label={t('reports.filter.time')}
                    value={timeFilter}
                    onChange={setTimeFilter}
                    options={timeOptions}
                  />
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {t('reports.filter.sortBy')}
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-full bg-ink-100 p-1">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sort === s.id ? 'bg-white text-brand-800 shadow-card' : 'text-ink-500'
                  }`}
                >
                  {t(s.key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm font-medium text-ink-500">
          {t('resolved.count', { count: sorted.length })}
        </p>

        <div className="mt-4 space-y-3">
          {paged.map((report, index) => (
            <ResolvedReportCard key={report.id} report={report} index={index} />
          ))}
          {sorted.length === 0 && <EmptyState title={t('resolved.empty')} />}
        </div>

        {sorted.length > 0 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-card sm:flex-row">
            <span className="text-sm text-ink-500">
              {t('reports.pagination.showing', {
                from: (pageSafe - 1) * PAGE_SIZE + 1,
                to: Math.min(pageSafe * PAGE_SIZE, sorted.length),
                total: sorted.length,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                aria-label={t('reports.pagination.prev')}
                className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-500 transition-colors hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - pageSafe) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-ink-300">
                      •••
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold transition-colors ${
                        n === pageSafe
                          ? 'bg-brand-800 text-white'
                          : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                aria-label={t('reports.pagination.next')}
                className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-500 transition-colors hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  )
}
