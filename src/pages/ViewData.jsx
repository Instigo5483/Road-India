import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import MobileBottomNav from '../components/MobileBottomNav'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'
import Button from '../components/Button'
import ReportHeatMap from '../components/ReportHeatMap'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useReports } from '../context/ReportsContext'
import { CATEGORIES, normalizeCategoryId, reportTypeIds } from '../data/categoryTypes'
import { toDate } from '../lib/time'
import { IconCheckCircle, IconMapPin, IconSiren, IconSparkle } from '../components/Icons'

const TIME_WINDOWS = [
  { id: '24h', ms: 24 * 60 * 60 * 1000, labelKey: 'reports.time.24h' },
  { id: '48h', ms: 48 * 60 * 60 * 1000, labelKey: 'data.time.48h' },
  { id: '7d', ms: 7 * 24 * 60 * 60 * 1000, labelKey: 'reports.time.7d' },
  { id: '30d', ms: 30 * 24 * 60 * 60 * 1000, labelKey: 'reports.time.30d' },
  { id: 'all', ms: null, labelKey: 'reports.time.all' },
]

const CHART_COLORS = ['#f97316', '#2563eb', '#16a34a', '#7c3aed', '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#059669', '#ea580c', '#0284c7', '#9333ea', '#64748b']

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function getTrend(reports, range) {
  const now = new Date()
  const days = range.ms ? Math.max(1, Math.ceil(range.ms / 86400000)) : 14
  const points = Array.from({ length: Math.min(days, 14) }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (Math.min(days, 14) - 1 - index))
    return { date, filed: 0, resolved: 0 }
  })
  const byDate = new Map(points.map((point) => [dateKey(point.date), point]))
  reports.forEach((report) => {
    const filedPoint = byDate.get(dateKey(toDate(report.createdAt)))
    if (filedPoint) filedPoint.filed += 1
    if (report.status === 'resolved') {
      const resolvedPoint = byDate.get(dateKey(toDate(report.resolvedAt ?? report.createdAt)))
      if (resolvedPoint) resolvedPoint.resolved += 1
    }
  })
  return points
}

function TrendChart({ points, lang, t }) {
  const [hover, setHover] = useState(null)
  const width = 680
  const height = 220
  const pad = { top: 14, right: 18, bottom: 36, left: 35 }
  const max = Math.max(...points.flatMap((point) => [point.filed, point.resolved]), 1)
  const x = (index) => pad.left + (index * (width - pad.left - pad.right)) / Math.max(points.length - 1, 1)
  const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom)
  const line = (key) => points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point[key])}`).join(' ')
  const tickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
  const activePoint = hover ? points[hover.index] : null
  const tooltipWidth = 132
  const tooltipX = activePoint
    ? Math.min(Math.max(x(hover.index) + 10, pad.left + 4), width - pad.right - tooltipWidth)
    : 0

  function setHoveredPoint(event, series) {
    const svg = event.currentTarget.ownerSVGElement
    const bounds = svg.getBoundingClientRect()
    const svgX = ((event.clientX - bounds.left) / bounds.width) * width
    const index = Math.max(
      0,
      Math.min(
        points.length - 1,
        Math.round(((svgX - pad.left) / (width - pad.left - pad.right)) * (points.length - 1))
      )
    )
    setHover({ series, index })
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[34rem] w-full" role="img" aria-label={t('data.trend.ariaLabel')}>
        <title>{t('data.trend.title')}</title>
        {[0, max / 2, max].map((value) => (
          <g key={value}>
            <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} stroke="#e2e8f0" />
            <text x={pad.left - 8} y={y(value) + 4} textAnchor="end" className="fill-ink-400 text-[10px]">{Math.round(value)}</text>
          </g>
        ))}
        {tickIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 12} textAnchor="middle" className="fill-ink-400 text-[10px]">
            {points[index].date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        {hover && <line x1={x(hover.index)} x2={x(hover.index)} y1={pad.top} y2={height - pad.bottom} stroke="#94a3b8" strokeDasharray="3 4" />}
        {['filed', 'resolved'].map((series) => {
          const isActive = hover?.series === series
          const color = series === 'filed' ? '#2563eb' : '#16a34a'
          return <g key={series}>
            <path d={line(series)} fill="none" stroke={color} strokeWidth={isActive ? 4.5 : 3} strokeOpacity={hover && !isActive ? 0.22 : 1} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke-width 180ms ease, stroke-opacity 180ms ease' }} />
            <path d={line(series)} fill="none" stroke="transparent" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer" onMouseEnter={(event) => setHoveredPoint(event, series)} onMouseMove={(event) => setHoveredPoint(event, series)} onMouseLeave={() => setHover(null)} onFocus={() => setHover({ series, index: 0 })} onBlur={() => setHover(null)} tabIndex={0} aria-label={t(series === 'filed' ? 'data.trend.filed' : 'data.trend.resolved')} />
          </g>
        })}
        {points.map((point, index) => (
          <g key={dateKey(point.date)}>
            <circle cx={x(index)} cy={y(point.filed)} r={hover?.series === 'filed' && hover.index === index ? '6' : '3.5'} fill="#2563eb" style={{ transition: 'r 180ms ease' }}><title>{`${t('data.trend.filed')}: ${point.filed}`}</title></circle>
            <circle cx={x(index)} cy={y(point.resolved)} r={hover?.series === 'resolved' && hover.index === index ? '6' : '3.5'} fill="#16a34a" style={{ transition: 'r 180ms ease' }}><title>{`${t('data.trend.resolved')}: ${point.resolved}`}</title></circle>
          </g>
        ))}
        {activePoint && <g style={{ pointerEvents: 'none' }}><rect x={tooltipX} y={pad.top + 6} width={tooltipWidth} height="58" rx="8" fill="#0f172a" opacity="0.96" /><text x={tooltipX + 10} y={pad.top + 23} fill="white" fontSize="11" fontWeight="600">{activePoint.date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</text><text x={tooltipX + 10} y={pad.top + 43} fill={hover.series === 'filed' ? '#93c5fd' : '#86efac'} fontSize="12" fontWeight="700">{t(hover.series === 'filed' ? 'data.trend.filed' : 'data.trend.resolved')}: {activePoint[hover.series]}</text></g>}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-ink-500">
        <span className={`inline-flex items-center gap-1.5 transition-opacity ${hover && hover.series !== 'filed' ? 'opacity-40' : ''}`}><i className="h-2.5 w-2.5 rounded-full bg-brand-600" />{t('data.trend.filed')}</span>
        <span className={`inline-flex items-center gap-1.5 transition-opacity ${hover && hover.series !== 'resolved' ? 'opacity-40' : ''}`}><i className="h-2.5 w-2.5 rounded-full bg-success-600" />{t('data.trend.resolved')}</span>
      </div>
    </div>
  )
}

function CategoryDonut({ data, t }) {
  const [activeId, setActiveId] = useState(null)
  const total = Math.max(data.reduce((sum, item) => sum + item.count, 0), 1)
  let current = 0
  const slices = data.map((item) => {
    const start = current
    current += (item.count / total) * 360
    return { ...item, start, end: current }
  })
  const activeItem = data.find((item) => item.id === activeId)
  const centerLabel = activeItem?.label ?? t('data.reports')
  // The doughnut centre is deliberately small. Splitting labels such as
  // “Road Emergency” into two centred lines preserves clear spacing instead
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
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 overflow-visible" role="img" aria-label={t('data.category.ariaLabel')} onMouseLeave={() => setActiveId(null)}>
        <title>{t('data.category.title')}</title>
        {slices.map((slice) => <path key={slice.id} d={slicePath(slice.start, slice.end)} fill={slice.color} onMouseEnter={() => setActiveId(slice.id)} onFocus={() => setActiveId(slice.id)} onBlur={() => setActiveId(null)} tabIndex={0} aria-label={`${slice.label}: ${slice.count}`} style={{ cursor: 'pointer', transformOrigin: '80px 80px', transform: activeId === slice.id ? 'scale(1.08)' : 'scale(1)', opacity: activeId && activeId !== slice.id ? 0.35 : 1, transition: 'transform 180ms ease, opacity 180ms ease' }} />)}
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
  const [heatMode, setHeatMode] = useState('reported')
  const range = TIME_WINDOWS.find((item) => item.id === rangeId) ?? TIME_WINDOWS[3]

  const scopedReports = useMemo(() => {
    const supported = reports.filter(
      (report) => normalizeCategoryId(report.category) === 'issue'
    )
    if (!range.ms) return supported
    const cutoff = Date.now() - range.ms
    return supported.filter((report) => toDate(report.createdAt).getTime() >= cutoff)
  }, [reports, range])
  const resolvedReports = useMemo(() => scopedReports.filter((report) => report.status === 'resolved'), [scopedReports])
  const trend = useMemo(() => getTrend(scopedReports, range), [scopedReports, range])
  const categoryData = useMemo(() => CATEGORIES[0].types.map((type, index) => ({
    id: type.id,
    label: t(type.labelKey),
    color: CHART_COLORS[index % CHART_COLORS.length],
    count: scopedReports.filter((report) => reportTypeIds(report).includes(type.id)).length,
  })).filter((item) => item.count > 0), [scopedReports, t])
  const locationData = useMemo(() => {
    const counts = new Map()
    scopedReports.forEach((report) => {
      const name = report.location?.city || report.location?.state || report.location?.address
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [scopedReports])
  const resolutionRate = scopedReports.length ? Math.round((resolvedReports.length / scopedReports.length) * 100) : 0
  const heatReports = heatMode === 'resolved' ? resolvedReports : scopedReports

  return (
    <div className="min-h-screen bg-ink-50 pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate(user ? '/home' : '/')} className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"><Logo className="h-8 w-8" />{t('common.appName')}</button>
          <div className="flex items-center gap-2.5"><LanguageSelector variant="neutral" /><Button size="sm" variant="secondary" onClick={() => navigate(user ? '/home' : '/login')}>{user ? t('nav.home') : t('landing.nav.login')}</Button></div>
        </div>
      </header>
      <PageTransition className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow-pill bg-brand-600/10 text-brand-700"><IconSparkle className="h-3.5 w-3.5" />{t('data.eyebrow')}</span>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">{t('data.title')}</h1>
            <p className="mt-2 max-w-2xl text-ink-500">{t('data.subtitle')}</p>
          </div>
          <div className="max-w-full overflow-x-auto rounded-full bg-ink-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-1.5">
              {TIME_WINDOWS.map((item) => <button key={item.id} type="button" onClick={() => setRangeId(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${rangeId === item.id ? 'bg-white text-brand-800 shadow-card' : 'text-ink-500'}`}>{t(item.labelKey)}</button>)}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric icon={IconSiren} label={t('data.totalReports')} value={scopedReports.length} color="text-brand-600 bg-brand-600/10" />
          <Metric icon={IconCheckCircle} label={t('data.resolvedReports')} value={resolvedReports.length} color="text-success-600 bg-success-500/10" />
          <Metric icon={IconSparkle} label={t('data.resolutionRate')} value={`${resolutionRate}%`} color="text-accent-600 bg-accent-500/10" />
        </div>

        <section className="mt-8 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-bold text-ink-900">{t('data.heat.title')}</h2><p className="mt-1 text-sm text-ink-500">{t('data.heat.subtitle')}</p></div><div className="flex rounded-full bg-ink-100 p-1"><button type="button" onClick={() => setHeatMode('reported')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${heatMode === 'reported' ? 'bg-white text-brand-800 shadow-card' : 'text-ink-500'}`}>{t('data.heat.reported')}</button><button type="button" onClick={() => setHeatMode('resolved')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${heatMode === 'resolved' ? 'bg-white text-success-600 shadow-card' : 'text-ink-500'}`}>{t('data.heat.resolved')}</button><button type="button" onClick={() => setHeatMode('compare')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${heatMode === 'compare' ? 'bg-white text-ink-800 shadow-card' : 'text-ink-500'}`}>{t('data.heat.compare')}</button></div></div>
          <div className="mt-5"><ReportHeatMap reports={heatReports} mode={heatMode} label={t('data.heat.tooltip')} comparisonLabel={t('data.heat.comparisonTooltip')} /></div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"><h2 className="font-display text-xl font-bold text-ink-900">{t('data.trend.title')}</h2><p className="mt-1 text-sm text-ink-500">{t('data.trend.subtitle')}</p><TrendChart points={trend} lang={lang} t={t} /></section>
          <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"><h2 className="font-display text-xl font-bold text-ink-900">{t('data.category.title')}</h2><p className="mt-1 text-sm text-ink-500">{t('data.category.subtitle')}</p><CategoryDonut data={categoryData} t={t} /></section>
        </div>

        <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"><div className="flex items-center gap-2"><IconMapPin className="h-5 w-5 text-brand-600" /><div><h2 className="font-display text-xl font-bold text-ink-900">{t('data.locations.title')}</h2><p className="mt-1 text-sm text-ink-500">{t('data.locations.subtitle')}</p></div></div><div className="mt-5 space-y-3">{locationData.length ? locationData.map((location) => <div key={location.name}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-ink-600">{location.name}</span><span className="font-semibold text-ink-900">{location.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(location.count / locationData[0].count) * 100}%` }} /></div></div>) : <p className="text-sm text-ink-400">{t('data.noData')}</p>}</div></section>
      </PageTransition>
      <MobileBottomNav />
    </div>
  )
}

function Metric({ icon: Icon, label, value, color }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-card"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><div><p className="font-display text-2xl font-bold text-ink-900">{value}</p><p className="text-xs text-ink-500">{label}</p></div></div>
}
