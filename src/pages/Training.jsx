import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_TENANT_TRAINING,
  CREATE_TENANT_TRAINING,
  UPDATE_TRAINING,
  DELETE_TRAINING,
} from '../api/training'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import TrainingDataForm from '../components/TrainingDataForm'

const PAGE_SIZE = 20

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Hierarchy explanation card ───────────────────────────────────────────────

function HierarchyCard() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How pricing data works</h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>
              <strong>Project-level</strong> (highest) — Overrides global training for that project
            </li>
            <li>
              <strong>Global</strong> (this page) — Base training for all projects in your organization
            </li>
            <li>
              <strong>Structured facts</strong> — Extracted pricing signals (rates, units, materials); used with your key/value entries
            </li>
          </ol>
          {expanded && (
            <div className="mt-3 p-3 rounded-xl bg-white/80 border border-indigo-100">
              <p className="text-xs text-gray-600">
                <strong>Example:</strong> Use “Teach your AI how you price” to extract structured facts (rates, units, materials). Project-level training overrides global when both apply to the same scope.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            {expanded ? 'Show less' : 'Learn more'}
          </button>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Custom data tab ──────────────────────────────────────────────────────────

function CustomDataTab({ tenantId }) {
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data, loading, refetch } = useQuery(GET_TENANT_TRAINING, {
    variables: { tenantId, page: { limit: PAGE_SIZE, offset }, search: search || undefined },
    skip: !tenantId,
  })

  const [createTraining, { loading: creating }] = useMutation(CREATE_TENANT_TRAINING, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })
  const [updateTraining, { loading: updating }] = useMutation(UPDATE_TRAINING, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })
  const [deleteTraining, { loading: deleting }] = useMutation(DELETE_TRAINING, {
    onCompleted: () => { setDeleteTarget(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const entries = data?.tenantTrainingData?.items ?? []
  const total = data?.tenantTrainingData?.total ?? 0

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Global custom data applied to all projects. Project-level data can override specific keys.
        </p>
        <button
          onClick={() => { setMutationError(null); setModal({ mode: 'create' }) }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add data
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by description or content…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <button type="submit" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setOffset(0) }} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : entries.length === 0 ? (
          <EmptyState
            title={search ? 'No results found' : 'No training data yet'}
            description={
              search
                ? 'No results matched your search.'
                : 'Add global training here, then add project-specific overrides on each project when you need different pricing for that job.'
            }
            action={
              !search && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => { setMutationError(null); setModal({ mode: 'create' }) }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    + Add your first training data
                  </button>
                  <Link to="/app/projects" className="text-xs text-gray-500 hover:text-indigo-600">
                    Go to a project to add project-level data →
                  </Link>
                </div>
              )
            }
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <div key={entry.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <div>
                          {entry.description ? (
                            <p className="text-sm font-semibold text-gray-900">{entry.description}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No label</p>
                          )}
                          <p className="text-xs text-gray-400">Added {formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                      {(entry.entries ?? []).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 ml-11 space-y-2">
                          {(entry.entries ?? []).map((e, i) => (
                            <div key={i} className="text-xs text-gray-700">
                              <p className="text-gray-800 break-words leading-snug">{e.key}</p>
                              <p className="text-gray-500 font-mono tabular-nums mt-0.5">{e.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setMutationError(null); setModal({ mode: 'edit', entry }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination offset={offset} limit={PAGE_SIZE} total={total} onPageChange={setOffset} />
          </>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Add training data' : 'Edit training data'}
        maxWidth="max-w-2xl"
      >
        {modal && (
          <TrainingDataForm
            key={modal.mode === 'edit' ? modal.entry.id : 'create'}
            initial={modal.entry}
            scopeLabel="training data"
            onSubmit={
              modal.mode === 'create'
                ? (input) =>
                    createTraining({
                      variables: {
                        input: {
                          tenantId,
                          entries: input.entries ?? [],
                          pricingFacts: input.pricingFacts ?? [],
                          description: input.description,
                        },
                      },
                    })
                : (input) =>
                    updateTraining({
                      variables: {
                        id: modal.entry.id,
                        tenantId,
                        input: {
                          entries: input.entries ?? [],
                          pricingFacts: input.pricingFacts ?? [],
                          description: input.description,
                        },
                      },
                    })
            }
            loading={creating || updating}
            error={mutationError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTraining({ variables: { id: deleteTarget.id, tenantId } })}
        loading={deleting}
        title="Delete training data"
        message={`Delete "${deleteTarget?.description || 'this entry'}"? This action cannot be undone.`}
      />
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Training() {
  const { user } = useAuth()
  const tenantId = user?.tenantId

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Training Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the data that guides AI models for project estimation and support.{' '}
          <Link to="/app/admin/train-estimator" className="text-indigo-600 font-medium hover:text-indigo-500 whitespace-nowrap">
            Train Estimator guide (visual) →
          </Link>
        </p>
      </div>

      <HierarchyCard />

      <CustomDataTab tenantId={tenantId} />
    </div>
  )
}
