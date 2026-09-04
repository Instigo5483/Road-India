import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import ReportCard from '../components/ReportCard'
import ReportsMapView from '../components/ReportsMapView'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  CATEGORIES,
  STATUSES,
} from '../data/categoryTypes'
import { distanceKm } from '../lib/geo'
import { toDate } from '../lib/time'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import {
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconListChecks,
  IconMapPin,
  IconAlertCircle,
} from '../components/Icons'

const SORTS = [
  { id: 'relevance', key: 'reports.sort.relevance' },
  { id: 'recent', key: 'reports.sort.recent' },
  { id: 'nearest', key: 'reports.sort.nearest' },
]

const PAGE_SIZE = 5

const SUPPORTED_CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id))

export default function ReportsFeed() {
  const { reports, toggleUpvote } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('relevance')
  const [viewMode, setViewMode] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [page, setPage] = useState(1)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  // "Ongoing" means not yet resolved -- resolved reports have their own
  // page (/resolved), so this feed's every stat, count, and filter option
  // is scoped to that same subset from the start.
  const ongoingReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.status !== 'resolved' && SUPPORTED_CATEGORY_IDS.has(report.category)
      ),
    [reports]
  )

  const liveStats = useMemo(
    () => ({
      active: ongoingReports.length,
      inProgress: ongoingReports.filter((r) => r.status === 'in_progress').length,
    }),
    [ongoingReports]
  )

  // Cascading location filter options, derived straight from the current
  // reports so the dropdowns only ever offer values that actually exist --
  // no separate hardcoded India admin-boundary dataset needed.
  const stateOptions = useMemo(() => uniqueValues(ongoingReports, 'state'), [ongoingReports])
  const districtOptions = useMemo(
    () =>
      uniqueValues(
        ongoingReports,
        'district',
        (r) => stateFilter === 'all' || r.location?.state === stateFilter
      ),
    [ongoingReports, stateFilter]
  )
  const cityOptions = useMemo(
    () =>
      uniqueValues(
        ongoingReports,
        'city',
        (r) =>
          (stateFilter === 'all' || r.location?.state === stateFilter) &&
          (districtFilter === 'all' || r.location?.district === districtFilter)
      ),
    [ongoingReports, stateFilter, districtFilter]
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

  const timeOptions = useMemo(
    () => TIME_RANGES.map((range) => ({ value: range.id, label: t(range.key) })),
    [t]
  )
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allStatuses') },
      ...STATUSES.filter((s) => s.id !== 'resolved').map((s) => ({
        value: s.id,
        label: t(s.labelKey),
      })),
    ],
    [t]
  )
  const stateDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allStates') },
      ...stateOptions.map((state) => ({ value: state, label: state })),
    ],
    [stateOptions, t]
  )
  const districtDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allDistricts') },
      ...districtOptions.map((district) => ({
        value: district,
        label: district,
      })),
    ],
    [districtOptions, t]
  )
  const cityDropdownOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allCities') },
      ...cityOptions.map((city) => ({ value: city, label: city })),
    ],
    [cityOptions, t]
  )

  const activeFilterCount = [
    statusFilter,
    timeFilter,
    stateFilter,
    districtFilter,
    cityFilter,
  ].filter((v) => v !== 'all').length

  const hasAnyFilter =
    activeFilterCount > 0 || categoryFilter !== 'all' || search.trim() !== ''

  function clearAllFilters() {
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setTimeFilter('all')
    setStateFilter('all')
    setDistrictFilter('all')
    setCityFilter('all')
  }

  // Fetched once on mount so distance sorting is ready as soon as the
  // citizen selects it.
  useEffect(() => {
    if (userLocation || locating) return
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocationError(true)
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }, [userLocation, locating])

  const withDistance = useMemo(
    () =>
      ongoingReports.map((r) => ({
        ...r,
        _distance: userLocation ? distanceKm(userLocation, r.location) : undefined,
      })),
    [ongoingReports, userLocation]
  )

  const filtered = useMemo(() => {
    let list = withDistance
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location?.address?.toLowerCase().includes(q)
      )
    }
    if (stateFilter !== 'all') list = list.filter((r) => r.location?.state === stateFilter)
    if (districtFilter !== 'all')
      list = list.filter((r) => r.location?.district === districtFilter)
    if (cityFilter !== 'all') list = list.filter((r) => r.location?.city === cityFilter)

    const range = TIME_RANGES.find((r) => r.id === timeFilter)
    if (range?.ms) {
      const cutoff = Date.now() - range.ms
      list = list.filter((r) => toDate(r.createdAt).getTime() >= cutoff)
    }

    return list
  }, [
    withDistance,
    categoryFilter,
    statusFilter,
    search,
    stateFilter,
    districtFilter,
    cityFilter,
    timeFilter,
  ])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'recent') {
      list.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
    } else if (sort === 'nearest' && userLocation) {
      list.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity))
    } else {
      // relevance: strongest community support first, newest breaks ties
      list.sort(
        (a, b) =>
          (b.upvotes ?? 0) - (a.upvotes ?? 0) ||
          toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
      )
    }
    return list
  }, [filtered, sort, userLocation])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, statusFilter, search, stateFilter, districtFilter, cityFilter, timeFilter, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(
    () => sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [sorted, pageSafe]
  )

  const categoryCounts = useMemo(() => {
    const counts = { all: ongoingReports.length }
    CATEGORIES.forEach((c) => {
      counts[c.id] = ongoingReports.filter((r) => r.category === c.id).length
    })
    return counts
  }, [ongoingReports])

  const categoryChips = [{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES]

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('reports.title')}
            </h1>
            <p className="mt-1.5 text-ink-500">{t('reports.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-card">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-brand-800 text-white' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <IconListChecks className="h-4 w-4" />
                {t('reports.view.list')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  viewMode === 'map' ? 'bg-brand-800 text-white' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <IconMapPin className="h-4 w-4" />
                {t('reports.view.map')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-4 text-sm font-bold text-white shadow-card transition-colors hover:bg-accent-600"
            >
              <IconAlertCircle className="h-4 w-4" />
              {t('reports.newReport')}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-xl bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
            </span>
            <span>{t('reports.stats.active', { count: liveStats.active })}</span>
            <span className="text-ink-300">•</span>
            <span className="font-normal text-ink-500">
              {t('reports.stats.inProgress', { count: liveStats.inProgress })}
            </span>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <IconListChecks className="h-3 w-3" />
            {t('reports.live')}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-4 py-2.5">
            <IconSearch className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reports.searchPlaceholder')}
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
                    label={t('reports.filter.status')}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                  />
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
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
              {t('reports.filter.sortBy')}
            </div>
            <div className="flex gap-1.5 rounded-full bg-ink-100 p-1">
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

          {sort === 'nearest' && locating && (
            <p className="mt-3 text-xs text-ink-400">{t('reports.locating')}</p>
          )}
          {sort === 'nearest' && locationError && (
            <p className="mt-3 text-xs text-warning-600">{t('reports.locationDenied')}</p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink-900 sm:text-xl">
            {t('reports.feed.title')}
          </h2>
          <span className="text-xs text-ink-400">{t('reports.feed.subtitle')}</span>
        </div>

        {viewMode === 'map' ? (
          <div className="mt-4">
            <ReportsMapView reports={sorted} user={user} onUpvote={(id) => toggleUpvote(id)} />
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {paged.map((report, i) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  index={i}
                  distanceKm={report._distance}
                  upvoted={user ? (report.upvotedBy ?? []).includes(user.uid) : false}
                  onUpvote={() => toggleUpvote(report.id)}
                />
              ))}

              {sorted.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmptyState title={t('reports.empty')} />
                </motion.div>
              )}
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
                    .filter(
                      (n) => n === 1 || n === totalPages || Math.abs(n - pageSafe) <= 1
                    )
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
          </>
        )}
      </PageTransition>
    </div>
  )
}
