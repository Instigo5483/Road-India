import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import {
  IconHome,
  IconAlertCircle,
  IconCheckCircle,
  IconChartBar,
  IconFolder,
} from './Icons'

const ITEMS = [
  { to: '/home', key: 'nav.mobile.home', icon: IconHome },
  { to: '/reports', key: 'nav.mobile.ongoing', icon: IconAlertCircle },
  { to: '/resolved', key: 'nav.mobile.resolved', icon: IconCheckCircle },
  { to: '/data', key: 'nav.mobile.data', icon: IconChartBar },
  { to: '/dashboard', key: 'nav.mobile.myReports', icon: IconFolder },
]

export default function MobileBottomNav() {
  const { t } = useLanguage()
  const location = useLocation()

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">
        {ITEMS.map(({ to, key, icon: Icon }) => {
          const active =
            to === '/home'
              ? location.pathname === '/' || location.pathname === '/home'
              : location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-accent-600' : 'text-ink-400 hover:text-ink-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{t(key)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
