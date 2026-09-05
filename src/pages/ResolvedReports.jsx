import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import ResolvedReportCard from '../components/ResolvedReportCard'
import ReportsMapView from '../components/ReportsMapView'
import EmptyState from '../components/EmptyState'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import Logo from '../components/Logo'
import FilterDropdown from '../components/FilterDropdown'
import MobileBottomNav from '../components/MobileBottomNav'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { toDate, formatDuration } from '../lib/time'
import { CATEGORIES, getTypesLabel, normalizeCategoryId, reportTypeIds } from '../data/categoryTypes'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import {
  IconCheckCircle,
  IconChevronDown,
  IconClock,
  IconFilter,
  IconListChecks,
  IconMapPin,
  IconSearch,
  IconShieldCheck,
  IconUser,
  IconX,
} from '../components/Icons'

const PAGE_SIZE = 3
const SORTS = [
  { id: 'recent', key: 'resolved.sort.recent' },
  { id: 'fastest', key: 'resolved.sort.fastest' },
  { id: 'upvoted', key: 'resolved.sort.upvoted' },
  { id: 'rating', key: 'resolved.sort.rating' },
]

function ResolvedHeader({ user, t, navigate }) {
  const links = [
    { to: '/home', key: 'nav.home' },
    { to: '/reports', key: 'nav.reports' },
    { to: '/resolved', key: 'nav.resolved' },
    { to: '/data', key: 'nav.data' },
    ...(user ? [{ to: '/dashboard', key: 'nav.dashboard' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => navigate(user ? '/home' : '/')} className="flex min-w-0 items-center gap-2 text-left">
          <Logo className="h-9 w-9 shrink-0" />
          <div className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-extrabold uppercase tracking-tight text-brand-900">{t('common.appName')}</span>
            <span className="block truncate text-[10px] leading-tight text-ink-400">{t('resolved.portalSubtitle')}</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <button key={link.to} type="button" onClick={() => navigate(link.to)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${link.to === '/resolved' ? 'bg-accent-50 text-accent-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'}`}>
              {t(link.key)}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector variant="neutral" />
          {user ? <UserMenu /> : (
            <button type="button" onClick={() => navigate('/login')} aria-label={t('landing.nav.login')} className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 text-white shadow-sm">
              <IconUser className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default function ResolvedReports() {
  const { reports } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [confirmedOnly, setConfirmedOnly] = useState(false)
  const [sort, setSort] = useState('recent')
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  const resolvedReports = useMemo(
    () => reports.filter((report) => report.status === 'resolved' && normalizeCategoryId(report.category) === 'issue'),
    [reports]
  )

  const resolutionStats = useMemo(() => {
    const durations = resolvedReports
      .map((report) => report.resolvedAt ? toDate(report.resolvedAt).getTime() - toDate(report.createdAt).getTime() : null)
      .filter((duration) => Number.isFinite(duration) && duration >= 0)
    const reviewed = resolvedReports.filter((report) => typeof report.citizenFeedback?.confirmedResolved === 'boolean')
    const confirmed = reviewed.filter((report) => report.citizenFeedback.confirmedResolved).length
    return {
      averageMs: durations.length ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : null,
      confirmationRate: reviewed.length ? Math.round((confirmed / reviewed.length) * 100) : null,
    }
  }, [resolvedReports])

  const typeCounts = useMemo(() => {
    const counts = { all: resolvedReports.length }
    CATEGORIES[0].types.forEach((type) => {
      counts[type.id] = resolvedReports.filter((report) => reportTypeIds(report).includes(type.id)).length
    })
    return counts
  }, [resolvedReports])

  const stateOptions = useMemo(() => uniqueValues(resolvedReports, 'state'), [resolvedReports])
  const districtOptions = useMemo(
    () => uniqueValues(resolvedReports, 'district', (report) => stateFilter === 'all' || report.location?.state === stateFilter),
    [resolvedReports, stateFilter]
  )
  const cityOptions = useMemo(
    () => uniqueValues(resolvedReports, 'city', (report) =>
      (stateFilter === 'all' || report.location?.state === stateFilter) &&
      (districtFilter === 'all' || report.location?.district === districtFilter)
    ),
    [resolvedReports, stateFilter, districtFilter]
  )

  const sortOptions = useMemo(() => SORTS.map((item) => ({ value: item.id, label: t(item.key) })), [t])
  const ratingOptions = useMemo(() => [
    { value: 'all', label: t('resolved.filter.ratingAll') },
    { value: '4', label: t('resolved.filter.rating4') },
    { value: '5', label: t('resolved.filter.rating5') },
  ], [t])
  const timeOptions = useMemo(() => TIME_RANGES.map((range) => ({ value: range.id, label: t(range.key) })), [t])
  const stateDropdownOptions = useMemo(() => [{ value: 'all', label: t('reports.filter.allStates') }, ...stateOptions.map((value) => ({ value, label: value }))], [stateOptions, t])
  const districtDropdownOptions = useMemo(() => [{ value: 'all', label: t('reports.filter.allDistricts') }, ...districtOptions.map((value) => ({ value, label: value }))], [districtOptions, t])
  const cityDropdownOptions = useMemo(() => [{ value: 'all', label: t('reports.filter.allCities') }, ...cityOptions.map((value) => ({ value, label: value }))], [cityOptions, t])

  function handleStateChange(value) {
    setStateFilter(value)
    setDistrictFilter('all')
    setCityFilter('all')
  }

  function handleDistrictChange(value) {
    setDistrictFilter(value)
    setCityFilter('all')
  }

  const activeAdvancedCount = [timeFilter, stateFilter, districtFilter, cityFilter].filter((value) => value !== 'all').length
  const hasAnyFilter = search.trim() || typeFilter !== 'all' || ratingFilter !== 'all' || confirmedOnly || activeAdvancedCount > 0 || sort !== 'recent'

  function clearAllFilters() {
    setSearch('')
    setTypeFilter('all')
    setRatingFilter('all')
    setConfirmedOnly(false)
    setSort('recent')
    setTimeFilter('all')
    setStateFilter('all')
    setDistrictFilter('all')
    setCityFilter('all')
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^#/, '')
    const range = TIME_RANGES.find((item) => item.id === timeFilter)
    return resolvedReports
      .filter((report) => typeFilter === 'all' || reportTypeIds(report).includes(typeFilter))
      .filter((report) => ratingFilter === 'all' || (report.citizenFeedback?.rating ?? 0) >= Number(ratingFilter))
      .filter((report) => !confirmedOnly || report.citizenFeedback?.confirmedResolved === true)
      .filter((report) => {
        if (!query) return true
        return [report.id, report.description, report.location?.address, report.location?.city, report.location?.district, report.location?.state, getTypesLabel(t, report.category, reportTypeIds(report))]
          .some((value) => value?.toLowerCase().includes(query))
      })
      .filter((report) => stateFilter === 'all' || report.location?.state === stateFilter)
      .filter((report) => districtFilter === 'all' || report.location?.district === districtFilter)
      .filter((report) => cityFilter === 'all' || report.location?.city === cityFilter)
      .filter((report) => !range?.ms || toDate(report.resolvedAt ?? report.createdAt).getTime() >= Date.now() - range.ms)
  }, [resolvedReports, search, typeFilter, ratingFilter, confirmedOnly, stateFilter, districtFilter, cityFilter, timeFilter, t])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'fastest') {
      list.sort((a, b) => {
        const aDuration = a.resolvedAt ? toDate(a.resolvedAt) - toDate(a.createdAt) : Infinity
        const bDuration = b.resolvedAt ? toDate(b.resolvedAt) - toDate(b.createdAt) : Infinity
        return aDuration - bDuration
      })
    } else if (sort === 'upvoted') {
      list.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.citizenFeedback?.rating ?? -1) - (a.citizenFeedback?.rating ?? -1))
    } else {
      list.sort((a, b) => toDate(b.resolvedAt ?? b.createdAt) - toDate(a.resolvedAt ?? a.createdAt))
    }
    return list
  }, [filtered, sort])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, ratingFilter, confirmedOnly, timeFilter, stateFilter, districtFilter, cityFilter, sort])

  const visibleReports = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page])
  const typeChips = [{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES[0].types]

  return (
    <div className="min-h-screen bg-ink-50 pb-20 lg:pb-0">
      <ResolvedHeader user={user} t={t} navigate={navigate} />
      <PageTransition className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6 sm:pt-7">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{t('resolved.title')}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">
              <span className="h-2 w-2 rounded-full bg-success-600" />
              {t('resolved.count', { count: resolvedReports.length })}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t('resolved.subtitle')}</p>

          <div className="mt-4 flex rounded-xl bg-ink-100 p-1 shadow-inner">
            <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>
              <IconListChecks className={`h-4 w-4 ${viewMode === 'list' ? 'text-accent-600' : ''}`} />
              {t('reports.view.listShort')}
            </button>
            <button type="button" onClick={() => setViewMode('map')} aria-pressed={viewMode === 'map'} className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>
              <IconMapPin className={`h-4 w-4 ${viewMode === 'map' ? 'text-accent-600' : ''}`} />
              {t('reports.view.mapShort')}
            </button>
          </div>
        </section>

        <section className="mt-3 rounded-xl bg-gradient-to-r from-brand-50 via-white to-ink-100 p-3 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-sm"><IconShieldCheck className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink-900">{t('resolved.stats.avgResolution')}: {resolutionStats.averageMs != null ? formatDuration(resolutionStats.averageMs) : '—'}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {resolutionStats.confirmationRate != null ? t('resolved.stats.confirmationRate', { rate: resolutionStats.confirmationRate }) : t('resolved.stats.confirmationEmpty')}
              </p>
            </div>
            <IconClock className="h-5 w-5 shrink-0 text-accent-600" />
          </div>
        </section>

        <section className="mt-4">
          <div className="relative rounded-xl bg-white shadow-card">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('resolved.searchPlaceholder')} type="search" className="h-12 w-full rounded-xl bg-transparent pl-10 pr-11 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:bg-white" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={t('reports.searchClear')} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"><IconX className="h-4 w-4" /></button>}
          </div>

          <div className="relative z-40 mt-3 flex flex-wrap items-center gap-2">
            <FilterDropdown label={t('reports.filter.sortBy')} value={sort} onChange={setSort} options={sortOptions} />
            <FilterDropdown label={t('resolved.filter.rating')} value={ratingFilter} onChange={setRatingFilter} options={ratingOptions} />
            <button type="button" onClick={() => setConfirmedOnly((value) => !value)} aria-pressed={confirmedOnly} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${confirmedOnly ? 'bg-accent-600 text-white shadow-sm' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}><IconCheckCircle className="h-4 w-4" />{t('resolved.filter.confirmed')}</button>
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold ${filtersOpen || activeAdvancedCount ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-700'}`}>
              <IconFilter className="h-3.5 w-3.5" />{t('reports.filter.more')}
              {activeAdvancedCount > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] text-brand-800">{activeAdvancedCount}</span>}
            </button>
            {hasAnyFilter && <button type="button" onClick={clearAllFilters} className="inline-flex min-h-10 items-center gap-1 px-1 text-xs font-semibold text-brand-700 hover:underline"><IconX className="h-3.5 w-3.5" />{t('reports.filter.clearAll')}</button>}
          </div>

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            {typeChips.map((chip) => (
              <button key={chip.id} type="button" onClick={() => setTypeFilter(chip.id)} className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors ${typeFilter === chip.id ? 'bg-accent-600 text-white shadow-sm' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {t('reports.filter.categoryCount', { label: t(chip.labelKey), count: typeCounts[chip.id] ?? 0 })}
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="relative z-30 mt-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card">
                <div className="flex flex-wrap gap-2">
                  <FilterDropdown label={t('reports.filter.time')} value={timeFilter} onChange={setTimeFilter} options={timeOptions} />
                  <FilterDropdown label={t('reports.filter.state')} value={stateFilter} onChange={handleStateChange} options={stateDropdownOptions} />
                  <FilterDropdown label={t('reports.filter.district')} value={districtFilter} onChange={handleDistrictChange} options={districtDropdownOptions} disabled={districtOptions.length === 0} />
                  <FilterDropdown label={t('reports.filter.city')} value={cityFilter} onChange={setCityFilter} options={cityDropdownOptions} disabled={cityOptions.length === 0} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-800">{t('resolved.eyebrow')}</h2>
          <span className="text-xs text-ink-400">{t('reports.results', { count: sorted.length })}</span>
        </div>

        {viewMode === 'map' ? (
          <div className="mt-3"><ReportsMapView reports={sorted} user={null} onUpvote={() => {}} /></div>
        ) : (
          <>
            <section aria-label={t('resolved.title')} className="mt-3 space-y-4">
              {visibleReports.map((report, index) => <ResolvedReportCard key={report.id} report={report} index={index} />)}
              {sorted.length === 0 && <EmptyState title={t('resolved.empty')} />}
            </section>
            {sorted.length > 0 && (
              <div className="mt-5 text-center">
                {visibleReports.length < sorted.length && <button type="button" onClick={() => setPage((current) => current + 1)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-ink-700 shadow-card transition-colors hover:bg-ink-100"><IconChevronDown className="h-4 w-4 text-accent-600" />{t('resolved.loadMore')}</button>}
                <p className="mt-2 text-xs text-ink-400">{t('resolved.pagination.summary', { shown: visibleReports.length, total: sorted.length })}</p>
              </div>
            )}
          </>
        )}
      </PageTransition>
      <MobileBottomNav />
    </div>
  )
}
