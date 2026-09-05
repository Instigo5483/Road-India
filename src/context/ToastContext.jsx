import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconCheckCircle, IconAlertCircle, IconX } from '../components/Icons'

import { ToastContext } from './contexts'
let idCounter = 0

const ICONS = {
  success: IconCheckCircle,
  error: IconAlertCircle,
  info: IconAlertCircle,
}
const STYLES = {
  success: 'border-success-200 bg-success-50 text-success-700',
  error: 'border-emergency-200 bg-emergency-50 text-emergency-700',
  info: 'border-brand-200 bg-brand-50 text-brand-700',
}

/** Lightweight toast/snackbar system -- a small stack of auto-dismissing
 * confirmation banners (top of screen), used to give visible feedback for
 * actions that otherwise change state silently (upvoting, leaving
 * feedback, an admin updating a report). Not a route/navigation
 * component, so AnimatePresence here doesn't hit the exit-animation bug
 * class documented in App.jsx/Login.jsx/ReportFlow.jsx -- that was
 * specifically about components that call navigate() while still mounted
 * during an exit transition; a toast has no such logic. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  useEffect(() => {
    const active = timers.current
    return () => { active.forEach(clearTimeout); active.clear() }
  }, [])

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = ++idCounter
      setToasts((prev) => [...prev.slice(-4), { id, message, type }])
      timers.current.set(id, setTimeout(() => dismiss(id), 3500))
    },
    [dismiss]
  )

  const value = useMemo(() => ({ showToast }), [showToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-card-hover ${
                  STYLES[toast.type] ?? STYLES.info
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                  className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
