import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { maskAadhaarId } from '../lib/format'
import {
  IconUser,
  IconChevronDown,
  IconSettings,
  IconGlobe,
  IconLogOut,
  IconCheck,
} from './Icons'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const { t, lang, setLang, languages } = useLanguage()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function closeMenu() {
    setOpen(false)
    setLanguageOpen(false)
  }

  const currentLanguage = languages.find((l) => l.code === lang)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50 sm:pr-3"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
          <IconUser className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-ink-700 sm:inline">
          {user?.name}
        </span>
        <IconChevronDown
          className={`h-3.5 w-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
            className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover"
          >
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{maskAadhaarId(user?.digilockerId)}</p>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                <IconSettings className="h-4 w-4 text-ink-400" />
                {t('nav.settings')}
              </button>

              <button
                type="button"
                role="menuitem"
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                <span className="flex items-center gap-2.5">
                  <IconGlobe className="h-4 w-4 text-ink-400" />
                  {t('nav.language')}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-400">
                  {currentLanguage?.nativeLabel}
                  <IconChevronDown
                    className={`h-3 w-3 transition-transform ${languageOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {languageOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-56 overflow-y-auto py-1 pl-3">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          role="menuitemradio"
                          aria-checked={l.code === lang}
                          onClick={() => {
                            setLang(l.code)
                            closeMenu()
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                            l.code === lang ? 'text-brand-800' : 'text-ink-600 hover:bg-ink-50'
                          }`}
                        >
                          {l.nativeLabel}
                          {l.code === lang && <IconCheck className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-1.5 border-t border-ink-100" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  logout()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emergency-600 transition-colors hover:bg-emergency-50"
              >
                <IconLogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
