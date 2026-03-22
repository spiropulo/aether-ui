/**
 * Add/edit training data: label, teach-your-AI (NL → structured facts), and structured pricing facts list.
 * Legacy key/value rows are preserved on save from `initial` when editing existing records (no UI to edit them here).
 */
import { useState } from 'react'
import Alert from './ui/Alert'
import Spinner from './ui/Spinner'
import { parseTrainingPricing } from '../api/trainingParse'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

const PROJECT_TYPE_OPTIONS = [
  { value: '', label: 'Any / not specified' },
  { value: 'fence', label: 'Fence' },
  { value: 'deck', label: 'Deck' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'interior', label: 'Interior' },
  { value: 'other', label: 'Other' },
]

const UNIT_OPTIONS = [
  { value: '', label: 'Let AI infer' },
  { value: 'linear_foot', label: 'Per linear foot' },
  { value: 'square_foot', label: 'Per square foot' },
  { value: 'each', label: 'Each' },
  { value: 'hour', label: 'Per hour' },
  { value: 'job', label: 'Per job' },
  { value: 'other', label: 'Other' },
]

function normalizeFact(f) {
  if (!f || typeof f !== 'object') return null
  return {
    id: f.id ?? '',
    projectType: f.projectType ?? null,
    material: f.material ?? null,
    unit: f.unit ?? null,
    priceMin: f.priceMin ?? null,
    priceMax: f.priceMax ?? null,
    pricePoint: f.pricePoint ?? null,
    includesLabor: f.includesLabor ?? null,
    condition: f.condition ?? null,
    notes: f.notes ?? null,
    source: f.source ?? 'parsed',
    confidence: f.confidence ?? null,
    basedOnCount: f.basedOnCount ?? null,
    observedAt: f.observedAt ?? null,
  }
}

function roundPrice(n) {
  if (n == null || n === '') return '—'
  const x = Number(n)
  if (Number.isNaN(x)) return String(n)
  return String(Math.round(x * 10000) / 10000)
}

function factDedupKey(f) {
  const pt = (f.projectType ?? '').toString().trim().toLowerCase()
  const mat = (f.material ?? '').toString().trim().toLowerCase()
  const u = (f.unit ?? '').toString().trim().toLowerCase()
  const cond = (f.condition ?? '').toString().trim().toLowerCase()
  const lab = f.includesLabor === true ? '1' : f.includesLabor === false ? '0' : 'x'
  return [pt, mat, u, cond, lab, roundPrice(f.priceMin), roundPrice(f.priceMax), roundPrice(f.pricePoint)].join('|')
}

function assignFactId(f) {
  if (!f.id) {
    f.id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `fact-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function dedupeIncomingBatch(facts) {
  const seen = new Set()
  const out = []
  for (const f of facts) {
    const k = factDedupKey(f)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
  }
  return out
}

function mergeFactsDedupe(prev, incoming) {
  const keys = new Set(prev.map((f) => factDedupKey(f)))
  const merged = [...prev]
  let added = 0
  let skipped = 0
  for (const f of incoming) {
    const k = factDedupKey(f)
    if (keys.has(k)) {
      skipped++
      continue
    }
    keys.add(k)
    assignFactId(f)
    merged.push(f)
    added++
  }
  return { merged, added, skipped }
}

export default function TrainingDataForm({ initial, onSubmit, loading, error, scopeLabel = 'training data' }) {
  const initialFacts = (initial?.pricingFacts ?? []).map(normalizeFact).filter(Boolean)

  const [form, setForm] = useState({
    description: initial?.description ?? '',
  })
  const [pricingFacts, setPricingFacts] = useState(initialFacts)

  const [nlText, setNlText] = useState('')
  const [projectTypeHint, setProjectTypeHint] = useState('')
  const [unitHint, setUnitHint] = useState('')
  const [parseLoading, setParseLoading] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [extractSuccess, setExtractSuccess] = useState(null)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleExtractFacts = async () => {
    if (!nlText.trim()) {
      setParseError('Write a sentence or two about how you price, then extract.')
      return
    }
    setParseError(null)
    setExtractSuccess(null)
    setParseLoading(true)
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aether_token') : null
      const data = await parseTrainingPricing({
        text: nlText,
        projectTypeHint: projectTypeHint || undefined,
        unitHint: unitHint || undefined,
        token,
      })
      const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : []
      const warnSuffix = warnings.length ? ` ${warnings.join(' ')}` : ''

      const raw = data.facts ?? []
      const normalized = raw.map(normalizeFact).filter(Boolean)
      const incoming = dedupeIncomingBatch(normalized)

      if (normalized.length === 0) {
        setExtractSuccess(
          `Nothing was extracted from that text.${warnSuffix || ' Try adding amounts, units (e.g. per foot), or materials.'}`
        )
        return
      }

      let mergeResult = { merged: [], added: 0, skipped: 0 }
      setPricingFacts((prev) => {
        mergeResult = mergeFactsDedupe(prev, incoming)
        return mergeResult.merged
      })

      const { added, skipped } = mergeResult

      let msg
      if (added > 0 && skipped === 0) {
        msg = `Added ${added} pricing fact${added === 1 ? '' : 's'}.${warnSuffix}`
      } else if (added > 0 && skipped > 0) {
        msg = `Added ${added} new fact${added === 1 ? '' : 's'}. Skipped ${skipped} duplicate${skipped === 1 ? '' : 's'} already in your list.${warnSuffix}`
      } else {
        msg = `No new facts added — ${skipped} duplicate${skipped === 1 ? '' : 's'} already match your list.${warnSuffix}`
      }
      setExtractSuccess(msg.trim())
      setNlText('')
    } catch (e) {
      setParseError(e.message || 'Extraction failed')
    } finally {
      setParseLoading(false)
    }
  }

  const removeFact = (id) => {
    setPricingFacts((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const entries = (initial?.entries ?? [])
      .filter((x) => (x.key ?? '').trim())
      .map((x) => ({ key: x.key.trim(), value: (x.value ?? '').trim() }))

    const factsPayload = pricingFacts.filter((f) => f && (f.id || f.projectType || f.pricePoint != null || f.priceMin != null))

    if (!entries.length && !factsPayload.length) return

    onSubmit({
      description: form.description.trim() || null,
      entries,
      pricingFacts: factsPayload.length ? factsPayload : undefined,
    })
  }

  const combinedError = error || parseError

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={combinedError} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label / description</label>
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="e.g. Redwood fencing — Bay Area rates"
          className={inputClass}
        />
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Teach your AI how you price</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Optional hints narrow extraction; then describe pricing in plain English. We turn it into structured facts the
            estimator uses (not raw blobs).
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project type (optional)</label>
            <select
              value={projectTypeHint}
              onChange={(e) => setProjectTypeHint(e.target.value)}
              className={inputClass}
            >
              {PROJECT_TYPE_OPTIONS.map((o) => (
                <option key={o.value || 'any'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit (optional)</label>
            <select value={unitHint} onChange={(e) => setUnitHint(e.target.value)} className={inputClass}>
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value || 'infer'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={nlText}
          onChange={(e) => {
            setNlText(e.target.value)
            setParseError(null)
            setExtractSuccess(null)
          }}
          rows={4}
          placeholder={
            'Example: I charge $85 per linear foot for redwood fencing installed. Labor runs $20–$30 per foot if the ground is rocky. Posts are about $40 each with install.'
          }
          className={`${inputClass} font-mono text-xs leading-relaxed resize-y min-h-[96px]`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExtractFacts}
            disabled={parseLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-60"
          >
            {parseLoading && <Spinner size="sm" />}
            Extract structured pricing
          </button>
          <span className="text-xs text-gray-500">Adds structured facts below; save when ready.</span>
        </div>
        {extractSuccess && (
          <Alert
            type="success"
            message={extractSuccess}
            onDismiss={() => setExtractSuccess(null)}
          />
        )}
      </div>

      {pricingFacts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">Structured pricing facts</span>
            <span className="text-xs text-gray-500">{pricingFacts.length} fact(s)</span>
          </div>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {pricingFacts.map((f) => (
              <li
                key={f.id || `${f.projectType}-${f.unit}-${f.pricePoint}`}
                className="flex gap-2 items-start text-xs rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="font-medium text-gray-800">
                    {[f.projectType, f.material].filter(Boolean).join(' · ') || 'Pricing fact'}
                    {f.unit ? <span className="text-gray-500 font-normal"> · {f.unit.replace(/_/g, ' ')}</span> : null}
                  </div>
                  <div className="text-gray-600">
                    {f.priceMin != null && f.priceMax != null && f.priceMin !== f.priceMax
                      ? `$${f.priceMin} – $${f.priceMax}`
                      : f.pricePoint != null
                        ? `$${f.pricePoint}`
                        : f.priceMin != null
                          ? `from $${f.priceMin}`
                          : ''}
                    {f.includesLabor != null ? ` · labor ${f.includesLabor ? 'included' : 'not included'}` : ''}
                    {f.condition ? ` · ${f.condition}` : ''}
                  </div>
                  {f.notes ? <div className="text-gray-500 italic">{f.notes}</div> : null}
                </div>
                {f.id && (
                  <button
                    type="button"
                    onClick={() => removeFact(f.id)}
                    className="text-gray-400 hover:text-red-600 p-1 flex-shrink-0"
                    title="Remove fact"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
