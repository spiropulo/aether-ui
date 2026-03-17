/**
 * Shared form for adding/editing training data (key-value pairs).
 * Used on AI Training page (global) and Project Detail (project-level).
 */
import { useState } from 'react'
import Alert from './ui/Alert'
import Spinner from './ui/Spinner'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

const PRESET_TEMPLATES = [
  { label: 'Material cost', key: 'wood_unit_cost', value: '24.50', hint: 'Unit cost per SF/LF/Each' },
  { label: 'Labor rate', key: 'hourly_rate', value: '85.00', hint: 'Hourly labor rate' },
  { label: 'State multiplier', key: 'state_multipliers.CA', value: '1.45', hint: 'Cost multiplier for state' },
  { label: 'Burden multiplier', key: 'burden_multiplier', value: '1.35', hint: 'Overhead on labor' },
  { label: 'Tier / profile', key: 'agent_profile.tier', value: 'Balanced', hint: 'Economy, Balanced, or Whiteglove' },
]

export default function TrainingDataForm({ initial, onSubmit, loading, error, scopeLabel = 'training data' }) {
  const initialEntries = initial?.entries?.length ? initial.entries : [{ key: '', value: '' }]
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    entries: initialEntries.map((e) => ({ key: e.key ?? '', value: e.value ?? '' })),
  })
  const [showPresets, setShowPresets] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleEntryChange = (idx, field, val) => {
    setForm((p) => ({
      ...p,
      entries: p.entries.map((e, i) => (i === idx ? { ...e, [field]: val } : e)),
    }))
  }
  const addEntry = () => setForm((p) => ({ ...p, entries: [...p.entries, { key: '', value: '' }] }))
  const removeEntry = (idx) =>
    setForm((p) => ({
      ...p,
      entries:
        p.entries.filter((_, i) => i !== idx).length > 0
          ? p.entries.filter((_, i) => i !== idx)
          : [{ key: '', value: '' }],
    }))

  const applyPreset = (preset) => {
    const hasEmpty = form.entries.some((e) => !(e.key ?? '').trim())
    if (hasEmpty) {
      setForm((p) => ({
        ...p,
        entries: p.entries.map((e, i) =>
          i === 0 && !(e.key ?? '').trim() ? { key: preset.key, value: preset.value } : e
        ),
      }))
    } else {
      setForm((p) => ({ ...p, entries: [...p.entries, { key: preset.key, value: preset.value }] }))
    }
    setShowPresets(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const entries = form.entries
      .filter((x) => (x.key ?? '').trim())
      .map((x) => ({ key: x.key.trim(), value: (x.value ?? '').trim() }))
    if (!entries.length) return
    onSubmit({ description: form.description.trim() || null, entries })
  }

  const hasDuplicateKeys = () => {
    const keys = form.entries.map((e) => (e.key ?? '').trim()).filter(Boolean)
    return keys.length !== new Set(keys).size
  }
  const duplicateWarning = hasDuplicateKeys()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label / description</label>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="e.g. Material costs for residential projects"
          className={inputClass}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <label className="block text-sm font-medium text-gray-700">Key-value pairs *</label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets((v) => !v)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Use preset
              </button>
              {showPresets && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[200px]">
                  {PRESET_TEMPLATES.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                    >
                      <span className="font-medium">{p.label}</span>
                      <span className="text-gray-400 ml-1">→ {p.key}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={addEntry} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              + Add pair
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {form.entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                value={entry.key}
                onChange={(e) => handleEntryChange(idx, 'key', e.target.value)}
                placeholder="e.g. wood_unit_cost, hourly_rate, state_multipliers.CA"
                className={`${inputClass} flex-1`}
              />
              <input
                value={entry.value}
                onChange={(e) => handleEntryChange(idx, 'value', e.target.value)}
                placeholder="e.g. 24.50, 1.45"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {duplicateWarning && (
          <p className="text-xs text-amber-600 mt-1">Duplicate keys will be merged; the last value wins.</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Use snake_case for keys. Values can be numbers or text. The AI uses these for pricing context.
        </p>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : `Add ${scopeLabel}`}
        </button>
      </div>
    </form>
  )
}
