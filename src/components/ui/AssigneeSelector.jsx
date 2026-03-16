/**
 * Multi-select for assigning team members to Tasks or Offers.
 * Expects teamMembers: [{ id, displayName, username }]
 */
function toStr(v) {
  return v == null ? '' : String(v)
}

export default function AssigneeSelector({ teamMembers = [], value = [], onChange, label = 'Assign team members', disabled }) {
  const selected = new Set((value ?? []).map(toStr))
  const handleToggle = (id) => {
    const key = toStr(id)
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next])
  }
  return (
    <div>
      {label != null && label !== '' && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto space-y-2">
        {teamMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No team members. Add members in Team.</p>
        ) : (
          teamMembers.map((m) => (
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
