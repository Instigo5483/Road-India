import { useEffect } from 'react'
import { useReports } from '../context/useAppContext'
import { useLanguage } from '../context/useAppContext'
import { useToast } from '../context/useAppContext'
import { reportTypeIds, getTypesLabel, getStatus } from '../data/categoryTypes'

import { useAuth } from '../context/useAppContext'

const SEEN_STATUS_KEY = 'road_india_seen_statuses'

function loadSeenStatuses(uid) {
  try {
    return JSON.parse(localStorage.getItem(SEEN_STATUS_KEY + ':' + uid)) ?? {}
  } catch {
    return {}
  }
}

function saveSeenStatuses(uid, map) {
  try {
    localStorage.setItem(SEEN_STATUS_KEY + ':' + uid, JSON.stringify(map))
  } catch {
    // Non-fatal -- just means a status change might get re-announced later.
  }
}

/** Watches the citizen's own reports for a status change since they were
 * last seen, and toasts about it -- mounted once at the application root, so a change is caught
 * wherever the citizen happens to be, not only when they check My
 * Reports. No push infrastructure needed: it just diffs against what was
 * last recorded in localStorage on every reports update. The first time
 * ever seeing a given report, its status is only recorded as a baseline
 * -- never toasted -- so this doesn't spam every existing report the
 * first time a citizen visits after this shipped. */
export function useReportStatusAlerts() {
  const { myReports, loading } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { showToast } = useToast()

  useEffect(() => {
    if (loading || !user) return
    const seen = loadSeenStatuses(user.uid)
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
      saveSeenStatuses(user.uid, next)
    }
  }, [myReports, loading, user, t, showToast])
}
