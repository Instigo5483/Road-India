import { useEffect } from 'react'
import { useReports } from '../context/ReportsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { reportTypeIds, getTypesLabel, getStatus } from '../data/categoryTypes'

const SEEN_STATUS_KEY = 'road_india_seen_statuses'

function loadSeenStatuses() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_STATUS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function saveSeenStatuses(map) {
  try {
    localStorage.setItem(SEEN_STATUS_KEY, JSON.stringify(map))
  } catch {
    // Non-fatal -- just means a status change might get re-announced later.
  }
}

/** Watches the citizen's own reports for a status change since they were
 * last seen, and toasts about it -- mounted in Navbar (present on every
 * citizen page) rather than just Dashboard, so a change is caught
 * wherever the citizen happens to be, not only when they check My
 * Reports. No push infrastructure needed: it just diffs against what was
 * last recorded in localStorage on every reports update. The first time
 * ever seeing a given report, its status is only recorded as a baseline
 * -- never toasted -- so this doesn't spam every existing report the
 * first time a citizen visits after this shipped. */
export function useReportStatusAlerts() {
  const { myReports, loading } = useReports()
  const { t } = useLanguage()
  const { showToast } = useToast()

  useEffect(() => {
    if (loading) return
    const seen = loadSeenStatuses()
    const next = { ...seen }
    let announced = false

    myReports.forEach((report) => {
      const previousStatus = seen[report.id]
      if (previousStatus && previousStatus !== report.status) {
        const typeLabel =
          getTypesLabel(t, report.category, reportTypeIds(report)) ||
          report.type
        showToast(
          t('toast.statusChanged', {
            type: typeLabel,
            status: t(getStatus(report.status).labelKey),
          })
        )
        announced = true
      }
      next[report.id] = report.status
    })

    if (announced || Object.keys(next).length !== Object.keys(seen).length) {
      saveSeenStatuses(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReports, loading])
}

