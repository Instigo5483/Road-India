import { useMemo } from 'react'
import { useLanguage, useReports } from '../context/useAppContext'
import { normalizeCategoryId } from '../data/categoryTypes'
import HomeIndiaMap from './HomeIndiaMap'
import HomeMapFrame from './HomeMapFrame'

export default function HomeHeatmapCard({ onReady }) {
  const { reports, loading, loadError } = useReports()
  const { lang } = useLanguage()
  const activeCount = useMemo(() => reports.filter(report => normalizeCategoryId(report.category) === 'issue' && report.status !== 'resolved').length, [reports])
  return <HomeMapFrame activeCount={loading || loadError ? '—' : activeCount.toLocaleString(lang)}>
    <HomeIndiaMap reports={reports} loading={loading} loadError={loadError} onReady={onReady} />
  </HomeMapFrame>
}
