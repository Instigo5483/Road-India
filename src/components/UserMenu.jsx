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
  IconLogOut,
  IconCheckCircle,
} from './Icons'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function closeMenu() {
    setOpen(false)
  }


  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-ink-50 py-2 pl-3.5 pr-2.5 transition-colors hover:bg-ink-100"
      >
        <span className="hidden max-w-[9rem] items-center gap-1 truncate text-sm font-semibold text-ink-900 sm:flex">
          <span className="truncate">{user?.name}</span>
          <IconCheckCircle className="h-3.5 w-3.5 shrink-0 text-success-600" />
        </span>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
          <IconUser className="h-3.5 w-3.5" />
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
              <p className="truncate text-sm font-semibold text-ink-900">
                {user?.name}
              </p>
              <p className="truncate text-xs text-ink-400">
                {maskAadhaarId(user?.digilockerId)}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-success-600">
                <IconCheckCircle className="h-3.5 w-3.5" />
                {t('home.verified')}
              </span>
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
