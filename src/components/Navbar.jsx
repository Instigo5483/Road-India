import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useReports } from '../context/ReportsContext'
import { useToast } from '../context/ToastContext'
import { reportTypeIds, getTypesLabel, getStatus } from '../data/categoryTypes'
import UserMenu from './UserMenu'
import Logo from './Logo'
import { IconMenu, IconChevronDown } from './Icons'

const links = [
  { to: '/home', key: 'nav.home' },
  { to: '/reports', key: 'nav.reports' },
  { to: '/resolved', key: 'nav.resolved' },
  { to: '/data', key: 'nav.data' },
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

/** Collapses the page nav links into a dropdown once the header is too
 * narrow to lay them out in a row (below `lg`) -- replaces what used to be
 * a horizontally-scrolling pill strip, which was awkward to discover and
 * scroll through on a phone. */
function PagesMenu() {
  const { t } = useLanguage()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const activeLink = links.find((link) => link.to === location.pathname)

  return (
    <div className="relative lg:hidden" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-ink-50 px-3.5 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
      >
        <IconMenu className="h-4 w-4 shrink-0 text-ink-500" />
        <span className="max-w-[7rem] truncate sm:max-w-[10rem]">
          {t(activeLink?.key ?? 'nav.home')}
        </span>
        <IconChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-card-hover"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-accent-50 text-accent-700' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar({ showMobilePagesMenu = true }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  useReportStatusAlerts()

  return (
    <header className="sticky top-0 z-20 bg-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/', { state: { fromNav: true } })}
          className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"
        >
          <Logo className="h-8 w-8" />
          <span className="hidden sm:inline">{t('common.appName')}</span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-accent-500"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative">{t(link.key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {showMobilePagesMenu && <PagesMenu />}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
