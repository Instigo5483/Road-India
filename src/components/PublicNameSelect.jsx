import { useEffect, useId, useRef, useState } from 'react'
import { IconCheck, IconChevronDown } from './Icons'

export default function PublicNameSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const buttons = useRef([])
  const id = useId()
  const selected = Math.max(0, options.findIndex(([key]) => key === value))

  useEffect(() => {
    if (!open) return
    buttons.current[selected]?.focus()
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open, selected])

  function close() { setOpen(false); trigger.current?.focus() }
  function handleKeys(event, index) {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    const next = { ArrowDown: (index + 1) % options.length, ArrowUp: (index + options.length - 1) % options.length, Home: 0, End: options.length - 1 }[event.key]
    if (next !== undefined) { event.preventDefault(); buttons.current[next]?.focus() }
  }

  return <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <span id={`${id}-label`} className="mb-2 block text-sm font-semibold">{label}</span>
    <button ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} aria-labelledby={`${id}-label ${id}-value`} onClick={() => setOpen(v => !v)} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true) } }} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${open ? 'border-accent-400' : 'border-ink-200 hover:border-ink-300'}`}>
      <span id={`${id}-value`} className="min-w-0 whitespace-normal leading-relaxed">{options[selected][1]}</span>
      <IconChevronDown className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} className="absolute inset-x-0 top-full z-40 mt-2 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card-hover">
      {options.map(([key, text], index) => <button ref={element => { buttons.current[index] = element }} key={key} type="button" role="option" aria-selected={key === value} onKeyDown={event => handleKeys(event, index)} onClick={() => { onChange(key); close() }} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm leading-relaxed outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 ${key === value ? 'bg-orange-50 font-semibold text-orange-800' : 'text-ink-700 hover:bg-ink-50'}`}>
        <span className="min-w-0 whitespace-normal">{text}</span>{key === value && <IconCheck className="h-4 w-4 shrink-0" />}
      </button>)}
    </div>}
  </div>
}
