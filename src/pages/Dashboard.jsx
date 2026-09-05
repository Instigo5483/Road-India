import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import MobileBottomNav from '../components/MobileBottomNav'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import Logo from '../components/Logo'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import ReportDetailModal from '../components/ReportDetailModal'
import StatusBadge from '../components/StatusBadge'
import FeedbackBadge from '../components/FeedbackBadge'
import { useReportStatusAlerts } from '../lib/useReportStatusAlerts'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { STATUSES, getTypesLabel, reportTypeIds, normalizeCategoryId } from '../data/categoryTypes'
import { computeCivicPoints } from '../lib/civicPoints'
import { timeAgo, toDate, formatTimestamp } from '../lib/time'
import { TIME_RANGES } from '../lib/reportFilters'
import { IconMapPin, IconSearch, IconFilter, IconCheck, IconUser, IconClock, IconArrowRight, IconEdit, IconX } from '../components/Icons'

function TrackerCard({ report, t, lang, onOpen }) {
  const current = Math.max(0, STATUSES.findIndex(s => s.id === report.status))
  const feedback = report.citizenFeedback
  return <article className="rounded-xl bg-white p-4 shadow-card sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <span className="max-w-full rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{getTypesLabel(t, report.category, reportTypeIds(report))}</span>
      <span className="break-all font-mono text-[11px] text-ink-500">#{report.id}</span>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-500"><IconClock className="h-3 w-3" />{timeAgo(report.createdAt, lang === 'hi' ? 'hi-IN' : 'en-IN')}<StatusBadge status={report.status} /></div>
    <h2 className="mt-3 break-words font-display text-lg font-bold leading-snug text-ink-900">{report.description}</h2>
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-ink-500"><IconMapPin className="h-4 w-4 shrink-0 text-accent-600" />{report.location?.address || report.location?.city}</p>
    {report.photoUrls?.length > 0 && <button type="button" onClick={() => onOpen(report.id)} aria-label={t('resolved.viewDetails')} className="relative mt-3 block h-40 w-full overflow-hidden rounded-lg">
      <img src={report.photoUrls[0]} alt={t('resolved.evidence')} loading="lazy" className="h-full w-full object-cover" />
      <span className="absolute bottom-2 right-2 rounded bg-ink-900/80 px-2 py-1 text-[10px] text-white">{t('reports.photos', {count: report.photoUrls.length})}</span>
    </button>}
    <div className="mt-4 rounded-xl bg-ink-50 p-3">
      <h3 className="mb-3 text-xs font-bold text-ink-900">{t('dashboard.mobile.tracker')}</h3>
      <ol className="space-y-0">{STATUSES.map((status,index) => <li key={status.id} aria-current={index === current ? 'step' : undefined} className="relative flex gap-3 pb-4 last:pb-0">
        {index < STATUSES.length - 1 && <span className={`absolute left-3.5 top-7 h-[calc(100%-28px)] w-px ${index < current ? 'bg-accent-400' : 'bg-ink-200'}`} />}
        <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index <= current ? 'bg-accent-500 text-white' : 'bg-ink-200 text-ink-500'}`}>{index < current || current === 3 ? <IconCheck className="h-4 w-4" /> : index + 1}</span>
        <div className="min-w-0 flex-1 pt-1"><p className={`text-xs font-semibold ${index === current ? 'text-accent-700' : 'text-ink-600'}`}>{t(status.labelKey)}</p>
          {index === 0 && <p className="mt-1 text-[10px] text-ink-400">{formatTimestamp(report.createdAt,lang === 'hi' ? 'hi-IN' : 'en-IN')}</p>}
          {index === 1 && report.aiTriage?.department && <p className="mt-1 text-[10px] text-ink-500">{t('report.aiTriage.routedTo',{department:report.aiTriage.department})}</p>}
          {index === 3 && report.resolvedAt && <p className="mt-1 text-[10px] text-ink-400">{formatTimestamp(report.resolvedAt,lang === 'hi' ? 'hi-IN' : 'en-IN')}</p>}
        </div>
      </li>)}</ol>
    </div>
    {feedback && <div className="mt-3 rounded-xl bg-ink-50 p-3"><h3 className="mb-2 text-xs font-bold">{t('dashboard.mobile.review')}</h3><FeedbackBadge feedback={feedback} />{feedback.review && <p className="mt-2 break-words text-sm text-ink-600">“{feedback.review}”</p>}</div>}
    <button type="button" onClick={() => onOpen(report.id)} className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${report.status === 'resolved' && !feedback ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-800'}`}>
      <IconMapPin className="h-4 w-4" />{t(report.status === 'resolved' && !feedback ? 'dashboard.mobile.verify' : 'dashboard.mobile.details')}<IconArrowRight className="h-4 w-4" />
    </button>
    {['submitted','in_review'].includes(report.status) && <button type="button" onClick={() => onOpen(report.id, true)} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink-50 text-xs font-semibold text-ink-600"><IconEdit className="h-4 w-4" />{t('reportEdit.button')}</button>}
  </article>
}

export default function Dashboard() {
  const { myReports, loading } = useReports()
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  useReportStatusAlerts()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,setSearch] = useState('')
  const [filtersOpen,setFiltersOpen] = useState(false)
  const [timeFilter,setTimeFilter] = useState('all')
  const [sort,setSort] = useState('recent')
  const [selected,setSelected] = useState(null)
  const supported = useMemo(() => myReports.filter(r => normalizeCategoryId(r.category) === 'issue'),[myReports])
  const counts = useMemo(() => Object.fromEntries([['all',supported.length],...STATUSES.map(s => [s.id,supported.filter(r => r.status === s.id).length])]),[supported])
  const points = useMemo(() => computeCivicPoints(supported),[supported])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^#/,'')
    const range = TIME_RANGES.find(r => r.id === timeFilter)
    return supported.filter(r => statusFilter === 'all' || r.status === statusFilter)
      .filter(r => !query || [r.id,r.description,r.location?.address,r.location?.city,getTypesLabel(t,r.category,reportTypeIds(r))].some(value => value?.toLowerCase().includes(query)))
      .filter(r => !range?.ms || toDate(r.createdAt).getTime() >= Date.now()-range.ms)
      .sort((a,b) => sort === 'recent' ? toDate(b.createdAt)-toDate(a.createdAt) : toDate(a.createdAt)-toDate(b.createdAt))
  },[supported,statusFilter,search,timeFilter,sort,t])
  const selectedReport = supported.find(r => r.id === selected?.id)
  const chips = [{id:'all',labelKey:'dashboard.filter.all'},...STATUSES]
  const links = [['/home','nav.home'],['/reports','nav.reports'],['/resolved','nav.resolved'],['/data','nav.data'],['/dashboard','nav.dashboard']]
  const reset = () => {setStatusFilter('all');setSearch('');setTimeFilter('all');setSort('recent')}
  const hasFilter = statusFilter !== 'all' || search || timeFilter !== 'all' || sort !== 'recent'
  return <div className="min-h-screen bg-[#f8f9fa] pb-20 lg:pb-0">
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/home')} className="flex min-w-0 items-center gap-2 text-left"><Logo className="h-8 w-8 shrink-0" /><span className="text-sm font-bold text-brand-900">Road India</span></button>
        <nav className="hidden gap-1 lg:flex">{links.map(([path,key]) => <button type="button" key={path} onClick={() => navigate(path)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${path === '/dashboard' ? 'bg-accent-50 text-accent-700' : 'text-ink-500'}`}>{t(key)}</button>)}</nav>
        <div className="flex items-center gap-2"><LanguageSelector variant="neutral" /><UserMenu /></div>
      </div>
    </header>
    <PageTransition className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <section className="rounded-xl bg-ink-100/60 p-3 sm:p-4">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#9d4300] text-sm font-bold text-white">{user?.name?.split(/\s+/).slice(0,2).map(s => s[0]).join('') || <IconUser className="h-5 w-5" />}</span>
          <div className="min-w-0"><p className="truncate font-display text-lg font-bold text-ink-900">{user?.name}</p><p className="mt-0.5 text-[11px] text-ink-500">{t('dashboard.mobile.points',{count:points})}</p></div>
        </div>
        <h1 className="mt-4 font-display text-[28px] font-bold tracking-tight text-ink-900">{t('dashboard.title')}</h1>
        <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-ink-600">
          <span className="h-2 w-2 rounded-full bg-accent-500" /><span>{t('dashboard.mobile.filed',{count:counts.all})}</span><span>·</span><span className="text-accent-700">{t('dashboard.mobile.active',{count:counts.all-counts.resolved})}</span><span>·</span><span>{t('dashboard.mobile.resolved',{count:counts.resolved})}</span>
        </div>
        <div className="mt-3 flex gap-2"><div className="relative min-w-0 flex-1"><IconSearch className="absolute left-3 top-4 h-4 w-4 text-ink-400" /><input aria-label={t('reports.searchPlaceholder')} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('reports.searchPlaceholder')} className="h-12 w-full rounded-xl bg-white pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-accent-400" /></div>
          <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-label={t('reports.filter.heading')} aria-expanded={filtersOpen} className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${filtersOpen ? 'bg-accent-500 text-white' : 'bg-ink-200 text-ink-600'}`}><IconFilter className="h-5 w-5" /></button>
        </div>
      </section>
      {filtersOpen && <div className="relative z-30 mt-3 flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-card">
        <FilterDropdown label={t('reports.filter.time')} value={timeFilter} onChange={setTimeFilter} options={TIME_RANGES.map(r => ({value:r.id,label:t(r.key)}))} />
        <FilterDropdown label={t('reports.filter.sortBy')} value={sort} onChange={setSort} options={[{value:'recent',label:t('reports.sort.recent')},{value:'oldest',label:t('dashboard.mobile.oldest')}]} />
      </div>}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none]">{chips.map(chip => <button key={chip.id} type="button" aria-pressed={statusFilter === chip.id} onClick={() => setStatusFilter(chip.id)} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${statusFilter === chip.id ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-500'}`}>{t(chip.labelKey)} ({counts[chip.id]})</button>)}</div>
      {hasFilter && <button type="button" onClick={reset} className="mb-3 flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-700"><IconX className="h-3 w-3" />{t('reports.filter.clearAll')}</button>}
      <div className="space-y-3">
        {loading && <p role="status" className="py-10 text-center text-sm text-ink-500">{t('dashboard.mobile.loading')}</p>}
        {!loading && !filtered.length && <EmptyState icon={<IconMapPin className="h-6 w-6" />} title={t(supported.length ? 'reports.empty' : 'dashboard.empty.title')} subtitle={t('dashboard.empty.subtitle')} />}
        {filtered.map(report => <TrackerCard key={report.id} report={report} t={t} lang={lang} onOpen={(id,edit=false) => setSelected({id,edit})} />)}
      </div>
      <div className="mt-6 flex justify-center"><button type="button" onClick={() => navigate('/report/issue')} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-500 px-5 text-sm font-bold text-white shadow-lg"><IconMapPin className="h-4 w-4" />{t('dashboard.mobile.new')}<IconArrowRight className="h-4 w-4" /></button></div>
    </PageTransition>
    <MobileBottomNav />
    {selectedReport && <ReportDetailModal key={selectedReport.id} report={selectedReport} initialEditing={selected.edit} onClose={() => setSelected(null)} showUpvote={false} />}
  </div>
}
