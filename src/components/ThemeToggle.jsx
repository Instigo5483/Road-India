import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { IconSun, IconMoon } from './Icons'

// Rendered once at the App root (not inside Navbar) so it's reachable on
// every route, including the ones with no Navbar -- Landing, Login,
// Admin/Team auth and dashboards. Without this, toggling to dark mode on
// a citizen page and then navigating to one of those left no way back.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-card-hover transition-colors hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
    >
      {theme === 'dark' ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </button>
  )
}
