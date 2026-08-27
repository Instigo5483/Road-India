import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { IconGlobe, IconCheck, IconChevronDown } from './Icons'

export default function LanguageSelector({ variant = 'light' }) {
  const { lang, setLang, languages, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = languages.find((l) => l.code === lang)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const chipClass =
    variant === 'light'
      ? 'bg-white/90 dark:bg-ink-900/90 text-ink-800 dark:text-ink-100 border border-white/60 hover:bg-white dark:hover:bg-ink-900'
      : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200 border border-ink-200 dark:border-ink-700 hover:bg-ink-200'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium shadow-card transition-colors ${chipClass}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <IconGlobe className="h-4 w-4" />
        <span>{current?.nativeLabel ?? 'English'}</span>
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 z-30 mt-2 max-h-80 w-56 overflow-y-auto rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-1.5 shadow-card-hover"
          >
            <p className="px-3 pb-1.5 pt-1 text-xs font-medium text-ink-400 dark:text-ink-500">
              {t('landing.chooseLanguage')}
            </p>
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  l.code === lang ? 'bg-brand-50 text-brand-800' : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {l.nativeLabel}
                  {!l.complete && (
                    <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] font-semibold text-warning-600">
                      EN
                    </span>
                  )}
                </span>
                {l.code === lang && <IconCheck className="h-4 w-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
