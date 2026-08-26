import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import UserMenu from './UserMenu'
import Logo from './Logo'

const links = [
  { to: '/home', key: 'nav.home' },
  { to: '/reports', key: 'nav.reports' },
  { to: '/dashboard', key: 'nav.dashboard' },
]

export default function Navbar() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 shadow-card backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"
        >
          <Logo className="h-8 w-8" />
          {t('common.appName')}
        </button>

        <nav className="hidden items-center gap-1 rounded-full bg-ink-50 p-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-ink-600 hover:text-brand-800'
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

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-200 px-4 py-1.5 md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-800 text-white' : 'text-ink-600'
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
