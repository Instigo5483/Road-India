import { lazy, Suspense } from 'react'
import { useLanguage } from '../context/useAppContext'

const Picker = lazy(() => import('./MapPicker'))
const Reports = lazy(() => import('./ReportsMapView'))
const Location = lazy(() => import('./ReportLocationMap'))
const HeatMap = lazy(() => import('./ReportHeatMap'))
const HomeMap = lazy(() => import('./HomeIndiaMap'))

function MapLoading({ children }) {
  const { t } = useLanguage()
  return <Suspense fallback={<div role="status" className="grid h-72 place-items-center rounded-xl bg-ink-100 text-sm text-ink-500">{t('common.loading')}</div>}>{children}</Suspense>
}
export function MapPicker(props) { return <MapLoading><Picker {...props} /></MapLoading> }
export function ReportsMapView(props) { return <MapLoading><Reports {...props} /></MapLoading> }
export function ReportLocationMap(props) { return <MapLoading><Location {...props} /></MapLoading> }
export function ReportHeatMap(props) { return <MapLoading><HeatMap {...props} /></MapLoading> }
export function HomeIndiaMap(props) {
  const { t } = useLanguage()
  return <Suspense fallback={<div className="home-india-map home-map-loading" role="status">{t('common.loading')}</div>}><HomeMap {...props} /></Suspense>
}
