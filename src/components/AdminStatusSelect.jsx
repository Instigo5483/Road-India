import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { STATUSES } from '../data/categoryTypes'
import { useLanguage } from '../context/LanguageContext'
import { IconCheck, IconChevronDown } from './Icons'

// Resolution requires the proof workflow, never a direct dropdown choice.
const OPTIONS = STATUSES.filter(status => status.id !== 'resolved')

export default function AdminStatusSelect({ value, reportId, disabled, onChange }) {
  const { t } = useLanguage()
  const [position, setPosition] = useState(null)
  const trigger = useRef(null)
  const menu = useRef(null)
  const items = useRef([])
  const id = useId()
  const open = Boolean(position)
  const selected = OPTIONS.findIndex(status => status.id === value)

  function show() {
    const rect = trigger.current.getBoundingClientRect()
    const width = Math.min(192, window.innerWidth - 16)
    const height = 154
    setPosition({ width, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), top: rect.bottom + height + 8 > window.innerHeight ? Math.max(8, rect.top - height - 6) : rect.bottom + 6 })
  }
  function close() { setPosition(null); trigger.current?.focus({ preventScroll: true }) }
  useEffect(() => {
    if (!open) return
    items.current[Math.max(0, selected)]?.focus({ preventScroll: true })
    function outside(event) {
      if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) setPosition(null)
    }
    const dismiss = () => setPosition(null)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('scroll', dismiss, true)
    }
  }, [open, selected])

  function keyDown(event, index) {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key === 'Tab') { event.preventDefault(); close(); return }
    const next = { ArrowDown: (index + 1) % OPTIONS.length, ArrowUp: (index + OPTIONS.length - 1) % OPTIONS.length, Home: 0, End: OPTIONS.length - 1 }[event.key]
    if (next !== undefined) { event.preventDefault(); items.current[next]?.focus({ preventScroll: true }) }
  }

  return <>
    <button ref={trigger} type="button" disabled={disabled} aria-label={`${t('admin.status.updateLabel')}: ${reportId}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show() } }} className="mt-2 flex min-h-10 min-w-28 items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-[11px] font-medium text-ink-700 transition-colors hover:border-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 disabled:opacity-50">
      <span>{selected >= 0 ? t(OPTIONS[selected].labelKey) : t('admin.status.updateLabel')}</span><IconChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && !disabled && createPortal(<div ref={menu} id={id} role="listbox" aria-label={`${t('admin.status.updateLabel')}: ${reportId}`} style={position} className="fixed z-[100] rounded-xl border border-ink-200 bg-white p-1.5 shadow-card-hover">
      {OPTIONS.map((status,index) => <button key={status.id} ref={element => { items.current[index] = element }} type="button" role="option" aria-selected={value === status.id} tabIndex={selected === index || (selected < 0 && index === 0) ? 0 : -1} onKeyDown={event => keyDown(event,index)} onClick={() => { close(); if (status.id !== value) onChange(status.id) }} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 ${value === status.id ? 'bg-orange-50 font-semibold text-orange-800' : 'text-ink-700 hover:bg-ink-50'}`}>
        {t(status.labelKey)}{value === status.id && <IconCheck className="h-3.5 w-3.5" />}
      </button>)}
    </div>, document.body)}
  </>
}
