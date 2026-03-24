import { useState, useRef, useEffect, useMemo } from 'react'

/**
 * Combobox for IANA timezone ids: type to filter, click to choose.
 * If `value` is not in `options`, it is still offered as “(saved value)”.
 */
export default function SearchableTimezoneSelect({ value, onChange, options, disabled, className }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  const optionSet = useMemo(() => new Set(options), [options])
  const savedNotListed = value && !optionSet.has(value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromList = q
      ? options.filter((z) => z.toLowerCase().includes(q))
      : options
    if (savedNotListed && value) {
      const matchesSaved = !q || value.toLowerCase().includes(q)
      if (matchesSaved && !fromList.includes(value)) {
        return [value, ...fromList]
      }
    }
    return fromList
  }, [options, query, value, savedNotListed])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
      searchRef.current.select()
    }
  }, [open])

  const pick = (tz) => {
    onChange(tz)
    setOpen(false)
    setQuery('')
  }

  const triggerClass =
    className ??
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-left text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition flex items-center justify-between gap-2'

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={triggerClass + (disabled ? ' opacity-50 cursor-not-allowed' : '')}
        onClick={() => {
          if (disabled) return
          setOpen((o) => !o)
          if (!open) setQuery('')
        }}
      >
        <span className={value ? 'truncate' : 'text-gray-400 truncate'}>
          {value || '— Select timezone —'}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col max-h-72"
          role="listbox"
        >
          <div className="p-2 border-b border-gray-100 shrink-0">
            <input
              ref={searchRef}
              type="search"
              autoComplete="off"
              placeholder="Search timezones…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') e.stopPropagation()
              }}
            />
          </div>
          <ul className="overflow-y-auto py-1 min-h-0">
            <li>
              <button
                type="button"
                role="option"
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                onClick={() => pick('')}
              >
                — Clear selection —
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No matches</li>
            ) : (
              filtered.map((z) => (
                <li key={z}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={z === value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
                      z === value ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-gray-900'
                    }`}
                    onClick={() => pick(z)}
                  >
                    {z}
                    {savedNotListed && z === value ? (
                      <span className="text-gray-500 font-normal"> (saved value)</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
