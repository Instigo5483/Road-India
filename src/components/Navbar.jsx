import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useReports } from '../context/ReportsContext'
import { useToast } from '../context/ToastContext'
import { reportTypeIds, getTypesLabel, getStatus } from '../data/categoryTypes'
import UserMenu from './UserMenu'
import Logo from './Logo'

const links = [
  { to: '/home', key: 'nav.home' },
  { to: '/reports', key: 'nav.reports' },
  { to: '/dashboard', key: 'nav.dashboard' },
]

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
function useReportStatusAlerts() {
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
        const typeLabel = getTypesLabel(t, report.category, reportTypeIds(report)) || report.type
        showToast(
          t('toast.statusChanged', { type: typeLabel, status: t(getStatus(report.status).labelKey) })
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

export default function Navbar() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  useReportStatusAlerts()

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 dark:border-ink-700 bg-white/95 dark:bg-ink-900/95 shadow-card backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"
        >
          <Logo className="h-8 w-8" />
          {t('common.appName')}
        </button>

        <nav className="hidden items-center gap-1 rounded-full bg-ink-50 dark:bg-ink-950 p-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-ink-600 dark:text-ink-300 hover:text-brand-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-brand-800"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t(link.key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-200 dark:border-ink-700 px-4 py-1.5 md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-800 text-white' : 'text-ink-600 dark:text-ink-300'
              }`
            }
          >
            {t(link.key)}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
