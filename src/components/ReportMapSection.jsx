import { useMemo, useState } from 'react'
import { useLanguage } from '../context/useAppContext'
import { ReportHeatMap } from './LazyMaps'

/** Shared map and controls keep public and admin analytics consistent. */
export default function ReportMapSection({ reports }) {
  const { t } = useLanguage()
  const [heatMode, setHeatMode] = useState('reported')
  const [mapDisplay, setMapDisplay] = useState('heatmap')
  const resolvedReports = useMemo(() => reports.filter(report => report.status === 'resolved'), [reports])

  return (
      <section className="mt-6 rounded-xl bg-white p-3 shadow-card sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent-700">{t('data.mobile.spatial')}</p>
          <h2 className="mt-1 font-display text-lg font-bold leading-snug text-ink-900">{t('data.mobile.heat')}</h2>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-ink-100 p-1">
          {['reported','resolved','compare'].map(mode => <button type="button" key={mode} aria-pressed={heatMode === mode} onClick={() => setHeatMode(mode)} className={`min-h-10 rounded-md px-1 text-[11px] font-semibold ${heatMode === mode ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>{t('data.heat.' + mode)}</button>)}
        </div>
        <div role="group" aria-label={t('data.map.display')} className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-ink-500">{t('data.map.display')}</span>
          {['heatmap', 'pins', 'both'].map(value => <button key={value} type="button" aria-pressed={mapDisplay === value} onClick={() => setMapDisplay(value)} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold transition-colors ${mapDisplay === value ? 'border-accent-500 bg-orange-50 text-orange-800' : 'border-ink-200 text-ink-500 hover:bg-ink-50'}`}>{t('data.map.' + value)}</button>)}
        </div>
        <div className="relative z-0 mt-3"><ReportHeatMap reports={heatMode === 'resolved' ? resolvedReports : reports} mode={heatMode} displayMode={mapDisplay} label={t('data.heat.tooltip')} comparisonLabel={t('data.heat.comparisonTooltip')} /></div>
        <p className="mt-2 text-[11px] text-ink-500">{t('data.map.region')}</p>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{t(heatMode === 'compare' ? 'data.mobile.compareLegend' : 'data.mobile.densityLegend')}</p>
      </section>
  )
}
