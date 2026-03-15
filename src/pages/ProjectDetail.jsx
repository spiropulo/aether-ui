import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_PROJECT_STATUS,
  GET_SUGGESTED_PROJECT_STATUSES,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  GET_TASKS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
} from '../api/projects'
import { downloadPdf } from '../api/estimate'
import {
  GET_PROJECT_TRAINING,
  CREATE_PROJECT_TRAINING,
  UPDATE_TRAINING,
  DELETE_TRAINING,
} from '../api/training'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Alert from '../components/ui/Alert'

const PAGE_SIZE = 20

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Project edit form ────────────────────────────────────────────────────────
function ProjectForm({ initial, suggestedStatuses = [], onSubmit, loading, error }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Project name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description…" className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
        <input
          name="status"
          type="text"
          value={form.status}
          onChange={handleChange}
          placeholder="e.g. Active, On Hold"
          list={suggestedStatuses.length ? 'project-status-suggestions-detail' : undefined}
          className={inputClass}
        />
        {suggestedStatuses.length > 0 && (
          <datalist id="project-status-suggestions-detail">
            {suggestedStatuses.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">End date</label>
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Save changes
        </button>
      </div>
    </form>
  )
}

// ─── Task form ────────────────────────────────────────────────────────────────
function TaskForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name: form.name.trim(), description: form.description.trim() || null })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Task name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description…" className={`${inputClass} resize-none`} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

// ─── Training data form ───────────────────────────────────────────────────────
function TrainingForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({ description: initial?.description ?? '', content: initial?.content ?? '' })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ description: form.description.trim() || null, content: form.content.trim() })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label / description</label>
        <input name="description" value={form.description} onChange={handleChange} placeholder="What is this training data about?" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
        <textarea name="content" required value={form.content} onChange={handleChange} rows={8} placeholder="Paste training content here…" className={`${inputClass} resize-none font-mono text-xs`} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Add training data'}
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const tenantId = user?.tenantId

  const [activeTab, setActiveTab] = useState('tasks')
  const [taskOffset, setTaskOffset] = useState(0)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskSearchInput, setTaskSearchInput] = useState('')
  const [taskSortBy, setTaskSortBy] = useState('name')
  const [taskSortDir, setTaskSortDir] = useState('asc')
  const [trainingOffset, setTrainingOffset] = useState(0)

  const [projectModal, setProjectModal] = useState(false)
  const [taskModal, setTaskModal] = useState(null)
  const [trainingModal, setTrainingModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const [mutationError, setMutationError] = useState(null)

  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(GET_PROJECT, {
    variables: { id: projectId, tenantId },
    skip: !tenantId,
  })

  const { data: statusPollData } = useQuery(GET_PROJECT_STATUS, {
    variables: { id: projectId, tenantId },
    skip: !tenantId || !projectData?.project,
    pollInterval: 5000,
    fetchPolicy: 'no-cache',
  })

  const { data: statusData } = useQuery(GET_SUGGESTED_PROJECT_STATUSES)
  const suggestedStatuses = statusData?.suggestedProjectStatuses ?? []

  const taskSearchActive = taskSearch.trim().length > 0

  useEffect(() => {
    setTaskOffset(0)
  }, [taskSearch, taskSortBy, taskSortDir])
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(GET_TASKS, {
    variables: {
      projectId,
      tenantId,
      page: taskSearchActive ? { limit: 500, offset: 0 } : { limit: PAGE_SIZE, offset: taskOffset },
    },
    skip: !tenantId,
  })

  const { data: trainingData, loading: trainingLoading, refetch: refetchTraining } = useQuery(GET_PROJECT_TRAINING, {
    variables: { tenantId, projectId, page: { limit: PAGE_SIZE, offset: trainingOffset } },
    skip: !tenantId || activeTab !== 'training',
  })

  const [updateProject, { loading: updatingProject }] = useMutation(UPDATE_PROJECT, {
    onCompleted: () => { setProjectModal(false); refetchProject() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteProject, { loading: deletingProject }] = useMutation(DELETE_PROJECT, {
    onCompleted: () => navigate('/app/projects'),
    onError: (e) => setMutationError(e.message),
  })

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK, {
    onCompleted: () => { setTaskModal(null); refetchTasks() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK, {
    onCompleted: () => { setTaskModal(null); refetchTasks() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTask, { loading: deletingTask }] = useMutation(DELETE_TASK, {
    onCompleted: () => { setDeleteTarget(null); refetchTasks() },
    onError: (e) => setMutationError(e.message),
  })

  const [createTraining, { loading: creatingTraining }] = useMutation(CREATE_PROJECT_TRAINING, {
    onCompleted: () => { setTrainingModal(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTraining, { loading: updatingTraining }] = useMutation(UPDATE_TRAINING, {
    onCompleted: () => { setTrainingModal(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTraining, { loading: deletingTraining }] = useMutation(DELETE_TRAINING, {
    onCompleted: () => { setDeleteTarget(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const displayStatus = statusPollData?.project?.status ?? project?.status
  const sourcePdfUploadId = statusPollData?.project?.sourcePdfUploadId ?? project?.sourcePdfUploadId

  const handleDownloadSourcePdf = async () => {
    if (!sourcePdfUploadId || !tenantId) return
    setDownloadingPdf(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const blob = await downloadPdf(sourcePdfUploadId, tenantId, { token })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${project?.name || 'estimate'}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_')
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setMutationError(err.message)
    } finally {
      setDownloadingPdf(false)
    }
  }
  const rawTasks = tasksData?.tasks?.items ?? []
  const rawTaskTotal = tasksData?.tasks?.total ?? 0

  const taskSearchLower = taskSearch.trim().toLowerCase()
  const filteredTasks = taskSearchLower
    ? rawTasks.filter(
        (t) =>
          (t.name ?? '').toLowerCase().includes(taskSearchLower) ||
          (t.description ?? '').toLowerCase().includes(taskSearchLower)
      )
    : rawTasks

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const mul = taskSortDir === 'asc' ? 1 : -1
    if (taskSortBy === 'name') {
      return mul * ((a.name ?? '').localeCompare(b.name ?? ''))
    }
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return mul * (aDate - bDate)
  })

  const taskTotal = taskSearchActive ? filteredTasks.length : rawTaskTotal
  const tasks = taskSearchActive
    ? sortedTasks.slice(taskOffset, taskOffset + PAGE_SIZE)
    : sortedTasks
  const trainings = trainingData?.projectTrainingData?.items ?? []
  const trainingTotal = trainingData?.projectTrainingData?.total ?? 0

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Project not found.{' '}
        <Link to="/app/projects" className="text-indigo-600 font-medium">Go back</Link>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/app/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{project.name}</span>
      </nav>

      {/* Project header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {displayStatus && (
                <span className="inline-block max-w-md px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 break-words whitespace-normal">
                  {displayStatus}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {project.startDate && <span>Start: {formatDate(project.startDate)}</span>}
                {project.endDate && <span>Due: {formatDate(project.endDate)}</span>}
              </div>
            )}
            {sourcePdfUploadId && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-sm font-medium text-indigo-900">Source PDF</p>
                <p className="text-xs text-indigo-700 mt-0.5">This project was created from an uploaded PDF estimate.</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={handleDownloadSourcePdf}
                    disabled={downloadingPdf}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 disabled:opacity-50"
                  >
                    {downloadingPdf ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    Download source PDF
                  </button>
                  <Link
                    to="/app/pdf-uploads"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    View training & agent activity
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setMutationError(null); setProjectModal(true) }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setDeleteTarget({ type: 'project', item: project })}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'tasks', label: 'Tasks' },
          { key: 'training', label: 'AI Training Data' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Tasks <span className="text-gray-400 font-normal text-sm ml-1">({taskTotal})</span>
              </h2>
              <form
                onSubmit={(e) => { e.preventDefault(); setTaskSearch(taskSearchInput); setTaskOffset(0) }}
                className="flex gap-2 flex-1 max-w-sm"
              >
                <input
                  value={taskSearchInput}
                  onChange={(e) => setTaskSearchInput(e.target.value)}
                  placeholder="Search tasks…"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
                <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  Search
                </button>
                {taskSearch && (
                  <button type="button" onClick={() => { setTaskSearch(''); setTaskSearchInput(''); setTaskOffset(0) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                    Clear
                  </button>
                )}
              </form>
            </div>
            <button
              onClick={() => { setMutationError(null); setTaskModal({ mode: 'create' }) }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New task
            </button>
          </div>

          {tasksLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title={taskSearch ? 'No matching tasks' : 'No tasks yet'}
              description={taskSearch ? 'Try a different search term.' : 'Add tasks to break this project down into trackable pieces of work.'}
              action={
                !taskSearch && (
                  <button
                    onClick={() => { setMutationError(null); setTaskModal({ mode: 'create' }) }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    + New task
                  </button>
                )
              }
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              }
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3">
                      <button
                        onClick={() => {
                          if (taskSortBy === 'name') setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                          else { setTaskSortBy('name'); setTaskSortDir('asc') }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        Task
                        {taskSortBy === 'name' && (
                          <span className="text-gray-400">{taskSortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 hidden md:table-cell">
                      <button
                        onClick={() => {
                          if (taskSortBy === 'createdAt') setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                          else { setTaskSortBy('createdAt'); setTaskSortDir('asc') }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        Created
                        {taskSortBy === 'createdAt' && (
                          <span className="text-gray-400">{taskSortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/app/projects/${projectId}/tasks/${task.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {task.name}
                        </Link>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-sm truncate">{task.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                        {task.createdAt ? formatDate(task.createdAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setMutationError(null); setTaskModal({ mode: 'edit', task }) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'task', item: task })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination offset={taskOffset} limit={PAGE_SIZE} total={taskTotal} onPageChange={setTaskOffset} />
            </>
          )}
        </div>
      )}

      {/* Training data tab */}
      {activeTab === 'training' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              AI Training Data <span className="text-gray-400 font-normal text-sm ml-1">({trainingTotal})</span>
            </h2>
            <button
              onClick={() => { setMutationError(null); setTrainingModal({ mode: 'create' }) }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add data
            </button>
          </div>

          {trainingLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : trainings.length === 0 ? (
            <EmptyState
              title="No training data"
              description="Add project-specific training data to improve AI estimates for this project."
              action={
                <button
                  onClick={() => { setMutationError(null); setTrainingModal({ mode: 'create' }) }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  + Add training data
                </button>
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
                {trainings.map((entry) => (
                  <div key={entry.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {entry.description && (
                          <p className="text-sm font-medium text-gray-800 mb-1">{entry.description}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg p-2 line-clamp-2">{entry.content}</p>
                        <p className="text-xs text-gray-300 mt-1.5">
                          Added {entry.createdAt ? formatDate(entry.createdAt) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setMutationError(null); setTrainingModal({ mode: 'edit', entry }) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'training', item: entry })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
              <Pagination offset={trainingOffset} limit={PAGE_SIZE} total={trainingTotal} onPageChange={setTrainingOffset} />
            </>
          )}
        </div>
      )}

      {/* Project edit modal */}
      <Modal open={projectModal} onClose={() => setProjectModal(false)} title="Edit project">
        <ProjectForm
          initial={{ ...project, status: displayStatus }}
          suggestedStatuses={suggestedStatuses}
          onSubmit={(input) => updateProject({ variables: { id: project.id, tenantId, input } })}
          loading={updatingProject}
          error={mutationError}
        />
      </Modal>

      {/* Task modals */}
      <Modal
        open={!!taskModal}
        onClose={() => setTaskModal(null)}
        title={taskModal?.mode === 'create' ? 'New task' : 'Edit task'}
      >
        {taskModal && (
          <TaskForm
            initial={taskModal.task}
            onSubmit={
              taskModal.mode === 'create'
                ? (input) => createTask({ variables: { input: { ...input, projectId, tenantId } } })
                : (input) => updateTask({ variables: { id: taskModal.task.id, projectId, tenantId, input } })
            }
            loading={creatingTask || updatingTask}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Training modal */}
      <Modal
        open={!!trainingModal}
        onClose={() => setTrainingModal(null)}
        title={trainingModal?.mode === 'create' ? 'Add training data' : 'Edit training data'}
        maxWidth="max-w-2xl"
      >
        {trainingModal && (
          <TrainingForm
            initial={trainingModal.entry}
            onSubmit={
              trainingModal.mode === 'create'
                ? (input) => createTraining({ variables: { input: { ...input, projectId, tenantId } } })
                : (input) => updateTraining({ variables: { id: trainingModal.entry.id, tenantId, input } })
            }
            loading={creatingTraining || updatingTraining}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deletingProject || deletingTask || deletingTraining}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.name || deleteTarget?.item?.description || 'this entry'}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget.type === 'project') deleteProject({ variables: { id: deleteTarget.item.id, tenantId } })
          else if (deleteTarget.type === 'task') deleteTask({ variables: { id: deleteTarget.item.id, projectId, tenantId } })
          else if (deleteTarget.type === 'training') deleteTraining({ variables: { id: deleteTarget.item.id, tenantId } })
        }}
      />
    </div>
  )
}
