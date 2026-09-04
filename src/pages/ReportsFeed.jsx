import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import OngoingReportCard from '../components/OngoingReportCard'
import ReportsMapView from '../components/ReportsMapView'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import MobileBottomNav from '../components/MobileBottomNav'
import Logo from '../components/Logo'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  CATEGORIES,
  STATUSES,
  getTypesLabel,
  normalizeCategoryId,
  reportTypeIds,
} from '../data/categoryTypes'
import { distanceKm, reverseGeocode } from '../lib/geo'
import { toDate } from '../lib/time'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import {
  IconAlertCircle,
  IconArrowRight,
  IconChevronDown,
  IconFilter,
  IconListChecks,
  IconMapPin,
  IconSearch,
  IconUser,
  IconX,
} from '../components/Icons'

const SORTS = [
  { id: 'relevance', key: 'reports.sort.relevance' },
  { id: 'recent', key: 'reports.sort.recent' },
  { id: 'nearest', key: 'reports.sort.nearest' },
]

const PAGE_SIZE = 4

function ReportsHeader({ user, t, navigate }) {
  const links = [
    { to: '/home', key: 'nav.home' },
    { to: '/reports', key: 'nav.reports' },
    { to: '/resolved', key: 'nav.resolved' },
    { to: '/data', key: 'nav.data' },
    ...(user ? [{ to: '/dashboard', key: 'nav.dashboard' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/home')} className="flex min-w-0 items-center gap-2 text-left">
          <Logo className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <span className="block truncate text-sm font-extrabold uppercase tracking-tight text-brand-900">{t('common.appName')}</span>
            <span className="block max-w-28 truncate text-[10px] leading-tight text-ink-400">{user?.name ?? t('nav.reports')}</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => navigate(link.to)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                link.to === '/reports'
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
              }`}
            >
              {t(link.key)}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector variant="neutral" />
          {user ? (
            <UserMenu />
          ) : (
            <button type="button" onClick={() => navigate('/login')} aria-label={t('landing.nav.login')} className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-white shadow-sm">
              <IconUser className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default function ReportsFeed() {
  const { reports, toggleUpvote, loading } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('relevance')
  const [viewMode, setViewMode] = useState('list')
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [gpsArea, setGpsArea] = useState('')
  const gpsRequested = useRef(false)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  const ongoingReports = useMemo(
    () => reports.filter((report) => report.status !== 'resolved' && normalizeCategoryId(report.category) === 'issue'),
    [reports]
  )

  const stateOptions = useMemo(() => uniqueValues(ongoingReports, 'state'), [ongoingReports])
  const districtOptions = useMemo(
    () => uniqueValues(ongoingReports, 'district', (report) => stateFilter === 'all' || report.location?.state === stateFilter),
    [ongoingReports, stateFilter]
  )
  const cityOptions = useMemo(
    () => uniqueValues(
      ongoingReports,
      'city',
      (report) =>
        (stateFilter === 'all' || report.location?.state === stateFilter) &&
        (districtFilter === 'all' || report.location?.district === districtFilter)
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
  const sortOptions = useMemo(
    () => SORTS.map((option) => ({ value: option.id, label: t(option.key) })),
    [t]
  )
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('reports.filter.allStatuses') },
      ...STATUSES.filter((status) => status.id !== 'resolved').map((status) => ({ value: status.id, label: t(status.labelKey) })),
    ],
    [t]
  )
  const stateDropdownOptions = useMemo(
    () => [{ value: 'all', label: t('reports.filter.allStates') }, ...stateOptions.map((state) => ({ value: state, label: state }))],
    [stateOptions, t]
  )
  const districtDropdownOptions = useMemo(
    () => [{ value: 'all', label: t('reports.filter.allDistricts') }, ...districtOptions.map((district) => ({ value: district, label: district }))],
    [districtOptions, t]
  )
  const cityDropdownOptions = useMemo(
    () => [{ value: 'all', label: t('reports.filter.allCities') }, ...cityOptions.map((city) => ({ value: city, label: city }))],
    [cityOptions, t]
  )

  const activeFilterCount = [typeFilter, statusFilter, timeFilter, stateFilter, districtFilter, cityFilter]
    .filter((value) => value !== 'all').length
  const hasAnyFilter = activeFilterCount > 0 || search.trim() !== '' || sort !== 'relevance'

  function clearAllFilters() {
    setSearch('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSort('relevance')
    setTimeFilter('all')
    setStateFilter('all')
    setDistrictFilter('all')
    setCityFilter('all')
    setGpsArea('')
  }

  useEffect(() => {
    if (loading) return
    if (gpsRequested.current) return
    gpsRequested.current = true
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserLocation(coords)
        const resolved = await reverseGeocode(coords.lat, coords.lng)

        const match = (options, candidate) => {
          if (!candidate) return null
          const normalized = candidate.trim().toLowerCase()
          return options.find((option) => {
            const value = option.trim().toLowerCase()
            return value === normalized || value.includes(normalized) || normalized.includes(value)
          }) ?? null
        }

        const matchedState = match(stateOptions, resolved?.state)
        const districtCandidates = uniqueValues(
          ongoingReports,
          'district',
          (report) => !matchedState || report.location?.state === matchedState
        )
        const matchedDistrict = match(districtCandidates, resolved?.district)
        const cityCandidates = uniqueValues(
          ongoingReports,
          'city',
          (report) =>
            (!matchedState || report.location?.state === matchedState) &&
            (!matchedDistrict || report.location?.district === matchedDistrict)
        )
        const matchedCity = match(cityCandidates, resolved?.city)

        if (matchedState) setStateFilter(matchedState)
        if (matchedDistrict) setDistrictFilter(matchedDistrict)
        if (matchedCity) setCityFilter(matchedCity)
        if (matchedCity || matchedDistrict || matchedState) {
          setGpsArea(matchedCity || matchedDistrict || matchedState)
        }
        setLocating(false)
      },
      () => {
        setLocationError(true)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [loading, ongoingReports, stateOptions])

  const withDistance = useMemo(
    () => ongoingReports.map((report) => ({
      ...report,
      _distance: userLocation ? distanceKm(userLocation, report.location) : undefined,
    })),
    [ongoingReports, userLocation]
  )

  const filtered = useMemo(() => {
    let list = withDistance
    if (typeFilter !== 'all') list = list.filter((report) => reportTypeIds(report).includes(typeFilter))
    if (statusFilter !== 'all') list = list.filter((report) => report.status === statusFilter)

    const query = search.trim().toLowerCase().replace(/^#/, '')
    if (query) {
      list = list.filter((report) =>
        report.id.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.location?.address?.toLowerCase().includes(query) ||
        report.location?.city?.toLowerCase().includes(query) ||
        getTypesLabel(t, report.category, reportTypeIds(report)).toLowerCase().includes(query)
      )
    }

    if (stateFilter !== 'all') list = list.filter((report) => report.location?.state === stateFilter)
    if (districtFilter !== 'all') list = list.filter((report) => report.location?.district === districtFilter)
    if (cityFilter !== 'all') list = list.filter((report) => report.location?.city === cityFilter)

    const range = TIME_RANGES.find((item) => item.id === timeFilter)
    if (range?.ms) {
      const cutoff = Date.now() - range.ms
      list = list.filter((report) => toDate(report.createdAt).getTime() >= cutoff)
    }
    return list
  }, [withDistance, typeFilter, statusFilter, search, stateFilter, districtFilter, cityFilter, timeFilter, t])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'recent') list.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
    else if (sort === 'nearest' && userLocation) list.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity))
    else list.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0) || toDate(b.createdAt) - toDate(a.createdAt))
    return list
  }, [filtered, sort, userLocation])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusFilter, search, stateFilter, districtFilter, cityFilter, timeFilter, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const visibleReports = useMemo(() => sorted.slice(0, pageSafe * PAGE_SIZE), [sorted, pageSafe])

  const typeCounts = useMemo(() => {
    const counts = { all: ongoingReports.length }
    CATEGORIES[0].types.forEach((type) => {
      counts[type.id] = ongoingReports.filter((report) => reportTypeIds(report).includes(type.id)).length
    })
    return counts
  }, [ongoingReports])
  const typeChips = [{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES[0].types]

  function openNewReport() {
    if (user) navigate('/report/issue')
    else navigate('/login', { state: { from: { pathname: '/report/issue' } } })
  }

  function supportReport(reportId) {
    if (user) toggleUpvote(reportId)
    else navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-20 lg:pb-0">
      <ReportsHeader user={user} t={t} navigate={navigate} />
      <PageTransition className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6 sm:pt-7">
        <section>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{t('reports.title')}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-50" />
                    <span className="relative h-2 w-2 rounded-full bg-accent-600" />
                  </span>
                  {t('reports.stats.activeShort', { count: ongoingReports.length })}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t('reports.subtitle')}</p>
            </div>

            <div className="flex shrink-0 rounded-lg bg-ink-100 p-0.5">
              <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`flex min-h-9 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>
                <IconListChecks className="h-4 w-4 text-accent-600" />
                <span>{t('reports.view.listShort')}</span>
              </button>
              <button type="button" onClick={() => setViewMode('map')} aria-pressed={viewMode === 'map'} className={`flex min-h-9 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-all ${viewMode === 'map' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>
                <IconMapPin className="h-4 w-4" />
                <span>{t('reports.view.mapShort')}</span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="relative rounded-xl bg-white shadow-card">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('reports.searchPlaceholder')} type="search" className="h-12 w-full rounded-xl bg-transparent pl-10 pr-11 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:bg-white" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label={t('reports.searchClear')} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative z-40 mt-3 flex flex-wrap items-center gap-2">
            <FilterDropdown label={t('reports.filter.sortBy')} value={sort} onChange={setSort} options={sortOptions} />
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${filtersOpen || statusFilter !== 'all' || timeFilter !== 'all' ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-700'}`}>
              <IconFilter className="h-3.5 w-3.5" />
              {t('reports.filter.more')}
              {[statusFilter, timeFilter].filter((value) => value !== 'all').length > 0 && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] text-brand-800">
                  {[statusFilter, timeFilter].filter((value) => value !== 'all').length}
                </span>
              )}
            </button>
            {hasAnyFilter && (
              <button type="button" onClick={clearAllFilters} className="inline-flex min-h-10 items-center gap-1.5 px-1 text-xs font-semibold text-brand-700 hover:underline">
                <IconX className="h-3.5 w-3.5" /> {t('reports.filter.clearAll')}
              </button>
            )}
          </div>

          <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            {typeChips.map((chip) => (
              <button key={chip.id} type="button" onClick={() => setTypeFilter(chip.id)} className={`min-h-11 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors ${typeFilter === chip.id ? 'bg-accent-600 text-white shadow-sm' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {t('reports.filter.categoryCount', { label: t(chip.labelKey), count: typeCounts[chip.id] ?? 0 })}
              </button>
            ))}
          </div>

          <div className="relative z-30 mt-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700">
                  <IconMapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-800">{t('reports.filter.locationHeading')}</p>
                  <p className={`truncate text-[11px] ${locationError ? 'text-warning-600' : 'text-ink-400'}`}>
                    {locating
                      ? t('reports.gps.locating')
                      : gpsArea
                        ? t('reports.gps.applied', { area: gpsArea })
                        : locationError
                          ? t('reports.gps.denied')
                          : t('reports.gps.manual')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown label={t('reports.filter.state')} value={stateFilter} onChange={handleStateChange} options={stateDropdownOptions} />
              <FilterDropdown label={t('reports.filter.district')} value={districtFilter} onChange={handleDistrictChange} options={districtDropdownOptions} disabled={districtOptions.length === 0} />
              <FilterDropdown label={t('reports.filter.city')} value={cityFilter} onChange={setCityFilter} options={cityDropdownOptions} disabled={cityOptions.length === 0} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="relative z-20">
                <div className="mt-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card">
                  <div className="flex flex-wrap gap-2">
                    <FilterDropdown label={t('reports.filter.status')} value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                    <FilterDropdown label={t('reports.filter.time')} value={timeFilter} onChange={setTimeFilter} options={timeOptions} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {sort === 'nearest' && locating && <p className="mt-2 text-xs text-ink-400">{t('reports.locating')}</p>}
          {sort === 'nearest' && locationError && <p className="mt-2 text-xs text-warning-600">{t('reports.locationDenied')}</p>}
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-800">{t('reports.feed.title')}</h2>
          <span className="text-xs text-ink-400">{t('reports.results', { count: sorted.length })}</span>
        </div>

        {viewMode === 'map' ? (
          <div className="mt-3">
            <ReportsMapView reports={sorted} user={user} onUpvote={supportReport} />
          </div>
        ) : (
          <>
            <section aria-label={t('reports.feed.title')} className="mt-3 space-y-3">
              {visibleReports.map((report, index) => (
                <OngoingReportCard
                  key={report.id}
                  report={report}
                  index={index}
                  distanceKm={report._distance}
                  upvoted={Boolean(user && (report.upvotedBy ?? []).includes(user.uid))}
                  canUpvote={Boolean(user)}
                  onUpvote={() => supportReport(report.id)}
                />
              ))}
              {sorted.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmptyState title={t('reports.empty')} />
                </motion.div>
              )}
            </section>

            {sorted.length > 0 && (
              <div className="mt-5 text-center">
                {pageSafe < totalPages && (
                  <button type="button" onClick={() => setPage((current) => current + 1)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-100 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-200">
                    <IconChevronDown className="h-4 w-4 text-accent-600" />
                    {t('reports.loadMore')}
                  </button>
                )}
                <p className="mt-2 text-xs text-ink-400">{t('reports.pagination.summary', { shown: visibleReports.length, total: sorted.length })}</p>
              </div>
            )}
          </>
        )}

        <div className="mt-8 flex justify-center pb-2">
          <button type="button" onClick={openNewReport} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(234,88,12,0.28)] transition-transform hover:-translate-y-0.5 active:scale-95">
            <IconAlertCircle className="h-5 w-5" />
            {t('reports.floatingCta')}
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      </PageTransition>
      <MobileBottomNav />
    </div>
  )
}
