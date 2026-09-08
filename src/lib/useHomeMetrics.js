import { useEffect, useMemo, useState } from 'react'
import { useReports } from '../context/useAppContext'
import { isFirebaseConfigured } from './firebase'
import { calculateHomeMetrics, fetchHomeMetrics } from './homeMetrics'

export function useHomeMetrics() {
  const { reports, loading, loadError } = useReports()
  const [preview, setPreview] = useState(null)
  const live = useMemo(() => loading || loadError ? null : calculateHomeMetrics(reports), [reports, loading, loadError])

  useEffect(() => {
    if (!loading || !isFirebaseConfigured) return
    const controller = new AbortController()
    fetchHomeMetrics({
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      emulator: import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
      signal: controller.signal,
    }).then(metrics => {
      if (!controller.signal.aborted) setPreview(metrics)
    }).catch(() => { /* The existing live report subscription is the fallback. */ })
    return () => controller.abort()
  }, [loading])

  // Live snapshots always win, even if the smaller request finishes later.
  return live ?? preview
}
