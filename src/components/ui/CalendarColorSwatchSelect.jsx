import { useState, useRef, useEffect } from 'react'
import { CALENDAR_COLORS } from './calendarColors'

/** Pulldown that shows only color swatches (no color names in the UI). */
export default function CalendarColorSwatchSelect({ value, onChange, disabled, triggerClassName, menuAlign = 'right' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const resolved = CALENDAR_COLORS.find((c) => c.value === value) ?? CALENDAR_COLORS[0]
  const current = value || CALENDAR_COLORS[0].value

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label="Calendar color"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={
          triggerClassName ??
          'flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-1 hover:bg-gray-50 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none disabled:opacity-50 transition-colors'
        }
      >
        <span
          className="inline-block w-7 h-7 rounded-md border border-black/10 shadow-inner"
          style={{ backgroundColor: resolved.value }}
        />
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className={`absolute top-full mt-1 z-20 flex flex-col gap-1 p-1.5 rounded-xl border border-gray-200 bg-white shadow-lg min-w-[3rem] ${
            menuAlign === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {CALENDAR_COLORS.map((c) => (
            <li key={c.value} role="option" aria-selected={current === c.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.value)
                  setOpen(false)
                }}
                className={`block w-8 h-8 rounded-md border-2 transition-all ${
                  current === c.value ? 'border-gray-900 scale-105' : 'border-transparent hover:border-gray-300'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
                aria-label={c.label}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
