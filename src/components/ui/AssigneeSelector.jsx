import { useMemo, useState } from 'react'

/**
 * Multi-select for assigning team members to Tasks or Offers.
 * Expects teamMembers: [{ id, displayName, username, email }]
 */
function toStr(v) {
  return v == null ? '' : String(v)
}

function memberSearchBlob(m) {
  return [m.displayName, m.username, m.email, m.id].filter(Boolean).join(' ').toLowerCase()
}

export default function AssigneeSelector({
  teamMembers = [],
  value = [],
  onChange,
  label = 'Assign team members',
  disabled,
  searchable = true,
}) {
  const [query, setQuery] = useState('')
  const selected = new Set((value ?? []).map(toStr))
  const handleToggle = (id) => {
    const key = toStr(id)
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next])
  }

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teamMembers
    return teamMembers.filter((m) => memberSearchBlob(m).includes(q))
  }, [teamMembers, query])

  return (
    <div>
      {label != null && label !== '' && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      {searchable && teamMembers.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search by name, username, or email…"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none transition mb-2 disabled:opacity-60"
        />
      )}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto space-y-2">
        {teamMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No team members. Add members in Team.</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No members match your search.</p>
        ) : (
          filteredMembers.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.has(toStr(m.id))}
                onChange={() => !disabled && handleToggle(m.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                {m.displayName || m.username || m.email || m.id}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
