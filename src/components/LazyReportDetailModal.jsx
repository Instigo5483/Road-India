import { lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/useAppContext'

const ReportDetailModal = lazy(() => import('./ReportDetailModal'))

export default function LazyReportDetailModal(props) {
  const { t } = useLanguage()
  const fallback = createPortal(
    <div role="status" className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/60" onClick={e => e.stopPropagation()}>
      <div className="rounded-xl bg-white p-6 text-center">
        <p>{t('common.loading')}</p>
        <button type="button" onClick={props.onClose} className="mt-4 min-h-10 px-4 text-brand-700">{t('common.close')}</button>
      </div>
    </div>, document.body)
  return <Suspense fallback={fallback}><ReportDetailModal {...props} /></Suspense>
}
