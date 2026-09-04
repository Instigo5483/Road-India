import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconChevronDown, IconCheck } from './Icons'

/**
 * A custom filter dropdown (button + floating options panel) rather than
 * a native <select> -- so it can be styled to match the rest of the app
 * instead of falling back to each browser's own select-box chrome, the
 * way a filter bar on a shopping site behaves.
 */
export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selected = options.find((o) => o.value === value)
  const isFiltered = value !== options[0]?.value

  return (
    <div className={`relative ${open ? 'z-50' : 'z-0'}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`filter-select inline-flex items-center gap-1.5 ${
          isFiltered ? 'border-brand-400 bg-brand-50 text-brand-800' : ''
        }`}
      >
        {selected?.label ?? label}
        <IconChevronDown
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute left-0 z-50 mt-2 max-h-64 w-52 overflow-y-auto rounded-2xl border border-ink-200 bg-white p-1.5 shadow-card-hover"
          >
            <p className="px-3 pb-1.5 pt-1 text-xs font-medium text-ink-400">
              {label}
            </p>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-ink-700 hover:bg-ink-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && (
                  <IconCheck className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
