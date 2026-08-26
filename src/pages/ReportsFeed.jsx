import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import PageTransition from '../components/PageTransition'
import ReportCard from '../components/ReportCard'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { CATEGORIES } from '../data/categoryTypes'
import { distanceKm } from '../lib/geo'
import { toDate } from '../lib/time'
import { TIME_RANGES, uniqueValues } from '../lib/reportFilters'
import { IconSearch, IconFilter, IconSiren, IconChevronDown } from '../components/Icons'

const SORTS = [
  { id: 'relevance', key: 'reports.sort.relevance' },
  { id: 'recent', key: 'reports.sort.recent' },
  { id: 'nearest', key: 'reports.sort.nearest' },
]

export default function ReportsFeed() {
  const { reports, toggleUpvote } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState('relevance')
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  // Cascading location filter options, derived straight from the current
  // reports so the dropdowns only ever offer values that actually exist --
  // no separate hardcoded India admin-boundary dataset needed.
  const stateOptions = useMemo(() => uniqueValues(reports, 'state'), [reports])
  const districtOptions = useMemo(
    () =>
      uniqueValues(
        reports,
        'district',
        (r) => stateFilter === 'all' || r.location?.state === stateFilter
      ),
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

  const timeOptions = useMemo(
    () => TIME_RANGES.map((range) => ({ value: range.id, label: t(range.key) })),
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
      ...districtOptions.map((district) => ({ value: district, label: district })),
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

  const activeFilterCount = [timeFilter, stateFilter, districtFilter, cityFilter].filter(
    (v) => v !== 'all'
  ).length

  useEffect(() => {
    if (sort !== 'nearest' || userLocation || locating) return
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
  }, [sort, userLocation, locating])

  const withDistance = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        _distance: userLocation ? distanceKm(userLocation, r.location) : undefined,
      })),
    [reports, userLocation]
  )

  const filtered = useMemo(() => {
    let list = withDistance
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.description?.toLowerCase().includes(q) ||
          r.location?.address?.toLowerCase().includes(q)
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

    return list
  }, [withDistance, categoryFilter, search, stateFilter, districtFilter, cityFilter, timeFilter])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'recent') {
      list.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
    } else if (sort === 'nearest' && userLocation) {
      list.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity))
    } else {
      // relevance: live emergencies first, then by community support
      list.sort((a, b) => {
        const emergencyDelta = (b.category === 'emergency') - (a.category === 'emergency')
        if (emergencyDelta !== 0) return emergencyDelta
        return (b.upvotes ?? 0) - (a.upvotes ?? 0)
      })
    }
    return list
  }, [filtered, sort, userLocation])

  const categoryChips = [{ id: 'all', labelKey: 'reports.filter.all' }, ...CATEGORIES]

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <PageTransition className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{t('reports.title')}</h1>
          <span className="hidden rounded-full bg-emergency-50 px-2.5 py-1 text-xs font-semibold text-emergency-600 sm:inline-flex sm:items-center sm:gap-1">
            <IconSiren className="h-3 w-3" /> live
          </span>
        </div>
        <p className="mt-1.5 text-ink-500">{t('reports.subtitle')}</p>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2.5 shadow-card">
          <IconSearch className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('reports.searchPlaceholder')}
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
              {t(chip.labelKey)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className="mt-5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400 transition-colors hover:text-brand-700"
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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

        <div className="mt-5 space-y-3">
          {sorted.map((report, i) => (
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
      </PageTransition>
    </div>
  )
}
