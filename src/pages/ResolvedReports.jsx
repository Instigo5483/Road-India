import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import ReportCard from '../components/ReportCard'
import EmptyState from '../components/EmptyState'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { toDate } from '../lib/time'
import { CATEGORIES } from '../data/categoryTypes'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import FilterDropdown from '../components/FilterDropdown'
import {
  IconCheckCircle,
  IconChevronDown,
  IconFilter,
  IconSearch,
  IconX,
} from '../components/Icons'

/** A public accountability feed: anyone can inspect completed work without
 * creating an account. ReportCard still exposes its full details/map modal. */
export default function ResolvedReports() {
  const { reports } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

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

  const resolvedReports = useMemo(() => {
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
      .sort((a, b) =>
        toDate(b.resolvedAt ?? b.createdAt) - toDate(a.resolvedAt ?? a.createdAt)
      )
  }, [
    reports,
    search,
    categoryFilter,
    stateFilter,
    districtFilter,
    cityFilter,
    timeFilter,
  ])

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(user ? '/home' : '/')}
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"
          >
            <Logo className="h-8 w-8" />
            {t('common.appName')}
          </button>
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

      <PageTransition className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success-500/10 text-success-600">
            <IconCheckCircle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('resolved.title')}
            </h1>
            <p className="mt-1 text-ink-500">{t('resolved.subtitle')}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2.5 shadow-card">
          <IconSearch className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('resolved.searchPlaceholder')}
            className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES].map((chip) => (
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
              {t(chip.labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
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

        <p className="mt-4 text-sm font-medium text-ink-500">
          {t('resolved.count', { count: resolvedReports.length })}
        </p>

        <div className="mt-4 space-y-3">
          {resolvedReports.map((report, index) => (
            <ReportCard
              key={report.id}
              report={report}
              index={index}
              showUpvote={false}
            />
          ))}
          {resolvedReports.length === 0 && <EmptyState title={t('resolved.empty')} />}
        </div>
      </PageTransition>
    </div>
  )
}
