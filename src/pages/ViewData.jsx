import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import MobileBottomNav from '../components/MobileBottomNav'
import LanguageSelector from '../components/LanguageSelector'
import UserMenu from '../components/UserMenu'
import Logo from '../components/Logo'
import ReportMapSection from '../components/ReportMapSection'
import { useAuth } from '../context/useAppContext'
import { useLanguage } from '../context/useAppContext'
import { useReports } from '../context/useAppContext'
import { CATEGORIES, normalizeCategoryId, reportTypeIds } from '../data/categoryTypes'
import { toDate, formatDuration, averageResolution as average, timestampIso } from '../lib/time'
import { IconCheckCircle, IconClock, IconListChecks, IconChartBar, IconUser } from '../components/Icons'

const TIME_WINDOWS = [
  { id: '24h', ms: 86400000, labelKey: 'reports.time.24h' },
  { id: '48h', ms: 172800000, labelKey: 'data.time.48h' },
  { id: '7d', ms: 7 * 86400000, labelKey: 'reports.time.7d' },
  { id: '30d', ms: 30 * 86400000, labelKey: 'reports.time.30d' },
  { id: '90d', ms: 90 * 86400000, labelKey: 'data.mobile.90d' },
  { id: 'all', ms: null, labelKey: 'reports.time.all' },
]
const CHART_COLORS = ['#f97316', '#006398', '#191c1d', '#7c3aed', '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#059669', '#ea580c', '#0284c7', '#9333ea', '#64748b']

function TrendChart({ points, lang, t }) {
  const [active, setActive] = useState(null)
  const maximum = Math.max(1, ...points.flatMap(p => [p.filed, p.resolved]))
  const point = points[active]
  return <div className="mt-4">
    <div aria-live="polite" className="mb-3 min-h-10 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
      {point ? `${point.date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}: ${point.filed} ${t('data.trend.filed')} · ${point.resolved} ${t('data.trend.resolved')}` : t('data.mobile.chartHint')}
    </div>
    <div className="overflow-x-auto pb-2">
      <div className="relative flex h-48 items-end gap-2 border-b border-ink-200 pt-4" style={{ minWidth: Math.max(260, points.length * 38) }}>
        {[0.25, 0.5, 0.75, 1].map(level => <div key={level} className="pointer-events-none absolute inset-x-0 border-t border-ink-100" style={{ bottom: `${level * 90}%` }} />)}
        {points.map((p, index) => <button key={p.date.toISOString()} type="button"
          aria-label={`${p.date.toLocaleDateString()}: ${p.filed} ${t('data.trend.filed')}, ${p.resolved} ${t('data.trend.resolved')}`}
          onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}
          className="relative flex h-full min-w-7 flex-1 items-end justify-center gap-1 rounded-t-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500">
          <span className="w-2/5 rounded-t bg-accent-500 transition-all duration-200" style={{ height: `${p.filed / maximum * 90}%`, minHeight: p.filed ? 3 : 0, opacity: active === null || active === index ? 1 : 0.4 }} />
          <span className="w-2/5 rounded-t bg-[#006398] transition-all duration-200" style={{ height: `${p.resolved / maximum * 90}%`, minHeight: p.resolved ? 3 : 0, opacity: active === null || active === index ? 1 : 0.4 }} />
        </button>)}
      </div>
      <div className="mt-2 flex gap-2" style={{ minWidth: Math.max(260, points.length * 38) }}>
        {points.map(p => <span key={p.date.toISOString()} className="min-w-7 flex-1 text-center text-[9px] text-ink-500">{p.date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</span>)}
      </div>
    </div>
    <div className="mt-3 flex justify-center gap-5 text-xs text-ink-500">
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-accent-500" />{t('data.trend.filed')}</span>
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-[#006398]" />{t('data.trend.resolved')}</span>
    </div>
  </div>
}

function CategoryDonut({ data, t }) {
  const [activeId, setActiveId] = useState(null)
  const total = Math.max(data.reduce((sum, item) => sum + item.count, 0), 1)
  let current = 0
  const slices = data.map((item) => {
    const start = current
    current += (item.count / total) * 359.999
    return { ...item, start, end: current }
  })
  const activeItem = data.find((item) => item.id === activeId)
  const centerLabel = activeItem?.label ?? t('data.reports')
  // The doughnut centre is deliberately small. Splitting labels such as
  // “Incomplete road work” into two centred lines preserves clear spacing instead
  // of letting a long category run into the ring.
  const centerLabelLines = centerLabel.split(/\s+/).reduce(
    (lines, word) => {
      if (lines.length === 1 && lines[0].length + word.length + 1 > 10) {
        return [lines[0], word]
      }
      lines[lines.length - 1] = `${lines[lines.length - 1]}${lines[lines.length - 1] ? ' ' : ''}${word}`
      return lines
    },
    ['']
  ).slice(0, 2)

  function pointAt(angle, radius) {
    const radians = ((angle - 90) * Math.PI) / 180
    return [80 + radius * Math.cos(radians), 80 + radius * Math.sin(radians)]
  }

  function slicePath(start, end) {
    const [outerStartX, outerStartY] = pointAt(start, 66)
    const [outerEndX, outerEndY] = pointAt(end, 66)
    const [innerEndX, innerEndY] = pointAt(end, 41)
    const [innerStartX, innerStartY] = pointAt(start, 41)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${outerStartX} ${outerStartY} A 66 66 0 ${largeArc} 1 ${outerEndX} ${outerEndY} L ${innerEndX} ${innerEndY} A 41 41 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`
  }
  return (
    <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0 overflow-visible" role="img" aria-label={t('data.category.title')} onMouseLeave={() => setActiveId(null)}>
        <title>{t('data.category.title')}</title>
        {slices.map((slice) => <path key={slice.id} d={slicePath(slice.start, slice.end)} fill={slice.color} onClick={() => setActiveId(slice.id)} onMouseEnter={() => setActiveId(slice.id)} onFocus={() => setActiveId(slice.id)} onBlur={() => setActiveId(null)} tabIndex={0} aria-label={`${slice.label}: ${slice.count}`} style={{ cursor: 'pointer', transformOrigin: '80px 80px', transform: activeId === slice.id ? 'scale(1.08)' : 'scale(1)', opacity: activeId && activeId !== slice.id ? 0.35 : 1, transition: 'transform 180ms ease, opacity 180ms ease' }} />)}
        <circle cx="80" cy="80" r="39" fill="white" />
        <text x="80" y={centerLabelLines.length > 1 ? '70' : '75'} textAnchor="middle" className="fill-ink-900 text-[22px] font-bold">{activeItem?.count ?? data.reduce((sum, item) => sum + item.count, 0)}</text>
        {centerLabelLines.map((line, index) => <text key={`${line}-${index}`} x="80" y={centerLabelLines.length > 1 ? 91 + index * 10 : 99} textAnchor="middle" className="fill-ink-500 text-[8px] font-medium">{line}</text>)}
      </svg>
      <div className="w-full space-y-3">
        {data.map((item) => (
          <div key={item.id} onMouseEnter={() => setActiveId(item.id)} onMouseLeave={() => setActiveId(null)} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-all ${activeId === item.id ? 'bg-ink-50 text-ink-900' : activeId ? 'opacity-40' : ''}`}>
            <span className="inline-flex items-center gap-2 text-ink-600"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
            <span className="font-semibold text-ink-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}



export default function ViewData() {
  const { reports } = useReports()
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [rangeId, setRangeId] = useState('30d')
  const [scale, setScale] = useState('weekly')
  const range = TIME_WINDOWS.find(item => item.id === rangeId)
  const supported = useMemo(() => reports.filter(r => normalizeCategoryId(r.category) === 'issue'), [reports])
  const bounds = useMemo(() => {
    const end = Date.now()
    const dates = supported.map(r => toDate(r.createdAt).getTime()).filter(Number.isFinite)
    return { end, start: range.ms ? end - range.ms : dates.reduce((min, date) => Math.min(min, date), end - 86400000) }
  }, [supported, range])
  const scopedReports = useMemo(() => supported.filter(r => toDate(r.createdAt).getTime() >= bounds.start && toDate(r.createdAt).getTime() <= bounds.end), [supported, bounds])
  const resolvedReports = useMemo(() => scopedReports.filter(r => r.status === 'resolved'), [scopedReports])
  const rate = scopedReports.length ? Math.round(resolvedReports.length / scopedReports.length * 100) : 0
  const avg = useMemo(() => average(resolvedReports), [resolvedReports])
  const trend = useMemo(() => {
    const step = (scale === 'daily' ? 1 : scale === 'weekly' ? 7 : 30) * 86400000
    const size = Math.max(step, Math.ceil((bounds.end - bounds.start) / 120))
    const points = Array.from({ length: Math.max(1, Math.ceil((bounds.end - bounds.start) / size)) }, (_, i) => ({ date: new Date(bounds.start + i * size), filed: 0, resolved: 0 }))
    const add = (value, key) => {
      if (!value) return
      const time = toDate(value).getTime()
      if (time < bounds.start || time > bounds.end || !Number.isFinite(time)) return
      const index = Math.min(points.length - 1, Math.floor((time - bounds.start) / size))
      points[index][key] += 1
    }
    supported.forEach(r => { add(r.createdAt, 'filed'); if (r.status === 'resolved') add(r.resolvedAt, 'resolved') })
    return points
  }, [supported, bounds, scale])
  const categoryData = useMemo(() => CATEGORIES[0].types.map((type, index) => ({
    id: type.id, label: t(type.labelKey), color: CHART_COLORS[index],
    count: scopedReports.filter(r => reportTypeIds(r).includes(type.id)).length,
  })).filter(item => item.count > 0), [scopedReports, t])
  const locations = useMemo(() => {
    const groups = new Map()
    scopedReports.forEach(r => {
      const name = r.location?.city || r.location?.state || r.location?.address
      if (name) {
        if (!groups.has(name)) groups.set(name, [])
        groups.get(name).push(r)
      }
    })
    return [...groups].map(([name, rows]) => {
      const closed = rows.filter(r => r.status === 'resolved')
      return { name, total: rows.length, closed: closed.length, rate: Math.round(closed.length / rows.length * 100), avg: average(closed) }
    }).sort((a,b) => b.rate - a.rate || b.total - a.total).slice(0,5)
  }, [scopedReports])

  function exportData(format) {
    const rows = scopedReports.map(r => ({ id: r.id, types: reportTypeIds(r).join('; '), status: r.status, city: r.location?.city || '', state: r.location?.state || '', createdAt: timestampIso(r.createdAt), resolvedAt: timestampIso(r.resolvedAt), lat: r.location?.lat, lng: r.location?.lng }))
    const csvCell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"'
    const fields = ['id','types','status','city','state','createdAt','resolvedAt','lat','lng']
    const content = format === 'csv' ? [fields.join(','), ...rows.map(row => fields.map(key => csvCell(row[key])).join(','))].join('\r\n')
      : JSON.stringify({ type: 'FeatureCollection', features: rows.filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng)).map(({lat,lng,...properties}) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lng,lat] } })) }, null, 2)
    const url = URL.createObjectURL(new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/geo+json' }))
    const a = document.createElement('a')
    a.href = url; a.download = `road-india-${rangeId}.${format}`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const links = [['/home','nav.home'],['/reports','nav.reports'],['/resolved','nav.resolved'],['/data','nav.data'],['/dashboard','nav.dashboard']]
  return <div className="min-h-screen bg-[#f8f9fa] pb-20 lg:pb-0">
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/home')} className="flex min-w-0 items-center gap-2 text-left"><Logo className="h-8 w-8 shrink-0" /><span className="min-w-0"><span className="block truncate text-sm font-bold text-brand-900">Road India</span><span className="block text-[9px] font-bold uppercase tracking-wider text-accent-600">{t('data.mobile.portal')}</span></span></button>
        <nav className="hidden gap-1 lg:flex">{links.map(([path,key]) => <button key={path} type="button" onClick={() => navigate(path)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${path === '/data' ? 'bg-accent-50 text-accent-700' : 'text-ink-500'}`}>{t(key)}</button>)}</nav>
        <div className="flex items-center gap-2"><LanguageSelector variant="neutral" />{user ? <UserMenu /> : <button type="button" onClick={() => navigate('/login')} aria-label={t('landing.nav.login')} className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-white"><IconUser className="h-4 w-4" /></button>}</div>
      </div>
    </header>
    <PageTransition className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-700"><IconChartBar className="h-4 w-4" />{t('data.mobile.eyebrow')}</div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><h1 className="font-display text-[28px] font-bold tracking-tight text-ink-900">{t('data.mobile.title')}</h1><span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">{t('resolved.liveData')}</span></div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {TIME_WINDOWS.map(item => <button key={item.id} type="button" aria-pressed={rangeId === item.id} onClick={() => setRangeId(item.id)} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${rangeId === item.id ? 'bg-accent-500 text-white shadow-sm' : 'bg-ink-100 text-ink-500'}`}>{t(item.labelKey)}</button>)}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Metric icon={IconListChecks} label={t('data.mobile.total')} value={scopedReports.length} sub={t('data.mobile.selectedPeriod')} />
        <Metric icon={IconCheckCircle} label={t('data.mobile.resolved')} value={resolvedReports.length} sub={`${rate}% ${t('data.mobile.fixRate')}`} />
        <Metric icon={IconClock} label={t('data.mobile.avg')} value={avg === null ? '—' : formatDuration(avg)} sub={t('data.mobile.turnaround')} />
      </div>
      <ReportMapSection reports={scopedReports} />
      <section className="mt-6 rounded-xl bg-white p-3 shadow-card sm:p-5">
        <SectionTitle eyebrow={t('data.mobile.velocity')} title={t('data.mobile.trend')} />
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-ink-100 p-1">{['daily','weekly','monthly'].map(value => <button key={value} type="button" aria-pressed={scale === value} onClick={() => setScale(value)} className={`min-h-9 rounded-md text-xs font-semibold ${scale === value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>{t('data.mobile.' + value)}</button>)}</div>
        <TrendChart key={rangeId + scale} points={trend} lang={lang} t={t} />
      </section>
      <section className="mt-6 rounded-xl bg-white p-3 shadow-card sm:p-5">
        <SectionTitle eyebrow={t('data.mobile.classification')} title={t('data.mobile.breakdown')} />
        {categoryData.length ? <CategoryDonut key={rangeId} data={categoryData} t={t} /> : <p className="py-8 text-center text-sm text-ink-500">{t('data.noData')}</p>}
      </section>
      <section className="mt-6 rounded-xl bg-white p-3 shadow-card sm:p-5">
        <SectionTitle eyebrow={t('data.mobile.ranking')} title={t('data.mobile.leaderboard')} />
        <div className="mt-4 space-y-2">{locations.map((location,index) => <div key={location.name} className="flex items-center gap-2 rounded-lg bg-ink-50 p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">#{index+1}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900">{location.name}</p><p className="mt-1 text-[10px] text-ink-500">{location.avg === null ? t('data.mobile.noTiming') : `${formatDuration(location.avg)} ${t('data.mobile.avg')}`}</p></div>
          <div className="shrink-0 text-right"><p className="text-sm font-bold text-[#006398]">{location.rate}%</p><p className="text-[10px] text-ink-500">{location.closed}/{location.total} {t('data.mobile.resolved')}</p></div>
        </div>)}{!locations.length && <p className="text-sm text-ink-500">{t('data.noData')}</p>}</div>
      </section>
      <section className="mt-6 rounded-xl bg-ink-900 p-5 text-white shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><IconChartBar className="h-5 w-5 text-accent-400" />{t('data.mobile.exportTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-300">{t('data.mobile.exportDescription')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">{['csv','geojson'].map(format => <button key={format} type="button" onClick={() => exportData(format)} className="min-h-12 rounded-lg bg-accent-500 px-2 text-xs font-bold text-white transition-colors hover:bg-accent-600">{t('data.mobile.export')} {format === 'csv' ? 'CSV' : 'GeoJSON'}</button>)}</div>
      </section>
    </PageTransition>
    <MobileBottomNav />
  </div>
}
function SectionTitle({ eyebrow, title }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-widest text-accent-700">{eyebrow}</p><h2 className="mt-1 font-display text-lg font-bold leading-snug text-ink-900">{title}</h2></div>
}
function Metric({ icon: Icon, label, value, sub }) {
  return <div className="min-w-0 rounded-xl bg-white p-3 shadow-card"><p className="flex items-center gap-1 text-[10px] text-ink-500"><Icon className="h-3.5 w-3.5 shrink-0 text-accent-600" />{label}</p><p className="mt-2 break-words font-display text-xl font-bold text-ink-900">{value}</p><p className="mt-1 text-[9px] text-ink-500">{sub}</p></div>
}
