import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_TASK,
  GET_TASKS,
  GET_OFFER,
  GET_OFFERS_BY_PROJECT,
  UPDATE_OFFER,
  DELETE_OFFER,
  GET_PROJECT_EMAILS,
  SEND_PROJECT_EMAIL,
} from '../api/projects'
import { GET_USER_PROFILES } from '../api/users'
import EmailComposeModal from '../components/EmailComposeModal'
import OfferForm from '../components/OfferForm'
import ProjectMessageHistoryItem from '../components/ProjectMessageHistoryItem'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizePhoneForSms(phone) {
  if (!phone || typeof phone !== 'string') return null
  const t = phone.trim()
  if (!t) return null
  if (t.startsWith('+')) {
    const rest = t.slice(1).replace(/\D/g, '')
    return rest ? `+${rest}` : null
  }
  const digits = t.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 10) return `+${digits}`
  return null
}

function memberDisplayName(m) {
  if (!m) return 'Unknown member'
  return (
    m.displayName ||
    [m.firstName, m.lastName].filter(Boolean).join(' ').trim() ||
    m.username ||
    m.email ||
    m.id
  )
}

function messageRecipientMembers(assigneeIds, teamMembers) {
  const seen = new Set()
  const out = []
  for (const id of assigneeIds ?? []) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const m = teamMembers.find((t) => t.id === id)
    const emailRaw = m?.email?.trim()
    const email = emailRaw || null
    const phoneE164 = m?.phoneNumber ? normalizePhoneForSms(m.phoneNumber) : null
    out.push({
      id,
      displayName: memberDisplayName(m),
      email,
      phoneE164,
    })
  }
  return out
}

function offerAssigneesLabel(offer, teamMembers) {
  if (!offer?.assigneeIds?.length) return 'No assignees'
  const names = offer.assigneeIds.map(
    (id) => teamMembers.find((m) => m.id === id)?.displayName || teamMembers.find((m) => m.id === id)?.username || id,
  )
  return names.filter(Boolean).join(', ') || '—'
}

function DescriptionEditForm({ offer, onSubmit, onClose, loading, error }) {
  const [value, setValue] = useState(offer?.description ?? '')
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(value.trim() || null)
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder="Detailed specs or scope of work…"
          className={`${inputClass} resize-y min-h-[200px]`}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          Save
        </button>
      </div>
    </form>
  )
}

export default function OfferDetail() {
  const { projectId, taskId, offerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [offerMainTab, setOfferMainTab] = useState('details')
  const [editModal, setEditModal] = useState(false)
  const [descriptionModal, setDescriptionModal] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mutationError, setMutationError] = useState(null)
  const [emailModal, setEmailModal] = useState(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [emailSearchInput, setEmailSearchInput] = useState('')

  const { data: projectData } = useQuery(GET_PROJECT, { variables: { id: projectId, tenantId }, skip: !tenantId })
  const { data: taskData } = useQuery(GET_TASK, {
    variables: { id: taskId, projectId, tenantId },
    skip: !tenantId,
  })
  const { data: teamData } = useQuery(GET_USER_PROFILES, {
    variables: { tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })
  const teamMembers = teamData?.userProfiles?.items ?? []

  const offerRefetchQueries = [
    { query: GET_OFFERS_BY_PROJECT, variables: { projectId, tenantId } },
    { query: GET_TASK, variables: { id: taskId, projectId, tenantId } },
    { query: GET_TASKS, variables: { projectId, tenantId, page: { limit: 200, offset: 0 } } },
  ]

  const {
    data: offerData,
    loading: offerLoading,
    refetch: refetchOffer,
  } = useQuery(GET_OFFER, {
    variables: { id: offerId, projectId, taskId, tenantId },
    skip: !tenantId || !offerId,
  })

  const { data: emailsData, refetch: refetchEmails } = useQuery(GET_PROJECT_EMAILS, {
    variables: { projectId, tenantId },
    skip: !tenantId || !projectId,
  })

  const [updateOffer, { loading: updatingOffer }] = useMutation(UPDATE_OFFER, {
    refetchQueries: [...offerRefetchQueries, { query: GET_OFFER, variables: { id: offerId, projectId, taskId, tenantId } }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setEditModal(false)
      setDescriptionModal(false)
      refetchOffer()
    },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteOffer, { loading: deletingOffer }] = useMutation(DELETE_OFFER, {
    refetchQueries: offerRefetchQueries,
    awaitRefetchQueries: true,
    onCompleted: () => {
      navigate(`/app/projects/${projectId}/tasks/${taskId}`, { replace: true })
    },
    onError: (e) => setMutationError(e.message),
  })

  const [sendProjectEmail, { loading: sendingEmail }] = useMutation(SEND_PROJECT_EMAIL, {
    onCompleted: () => {
      setEmailModal(null)
      refetchEmails()
    },
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const task = taskData?.task
  const offer = offerData?.offer

  const pricingInProgress = project?.status === 'PRICING'

  const offerRecipients = useMemo(
    () => messageRecipientMembers(offer?.assigneeIds, teamMembers),
    [offer?.assigneeIds, teamMembers],
  )
  const canMessageOfferAssignees = offerRecipients.some((r) => r.email || r.phoneE164)
  const offerWithEmail = offerRecipients.filter((r) => r.email).length
  const offerWithPhone = offerRecipients.filter((r) => r.phoneE164).length

  const projectEmails = emailsData?.projectEmails ?? []
  const offerEmails = useMemo(
    () => projectEmails.filter((e) => e.offerId === offerId),
    [projectEmails, offerId],
  )
  const emailSearchLower = emailSearch.trim().toLowerCase()
  const filteredOfferEmails = useMemo(() => {
    if (!emailSearchLower) return offerEmails
    return offerEmails.filter((e) => {
      const subject = (e.subject ?? '').toLowerCase()
      const body = (e.body ?? '').toLowerCase()
      const phones = (e.toPhoneNumbers ?? []).join(' ').toLowerCase()
      const channels = (e.deliveryChannels ?? []).join(' ').toLowerCase()
      const toStr = (e.toEmails ?? []).join(' ').toLowerCase()
      return (
        subject.includes(emailSearchLower) ||
        body.includes(emailSearchLower) ||
        toStr.includes(emailSearchLower) ||
        phones.includes(emailSearchLower) ||
        channels.includes(emailSearchLower)
      )
    })
  }, [offerEmails, emailSearchLower])

  if (offerLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <EmptyState title="Offer not found" description="It may have been removed or the link is invalid." />
        <div className="mt-6 text-center">
          <Link to={`/app/projects/${projectId}/tasks/${taskId}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Back to task
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {pricingInProgress && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Spinner size="sm" />
          <span className="font-medium">AI is pricing this project</span>
          <span className="text-amber-700 text-sm">Editing may be limited until pricing finishes.</span>
        </div>
      )}

      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/app/projects" className="hover:text-indigo-600 transition-colors">
          Projects
        </Link>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link to={`/app/projects/${projectId}`} className="hover:text-indigo-600 transition-colors truncate max-w-32">
          {project?.name ?? 'Project'}
        </Link>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link to={`/app/projects/${projectId}/tasks/${taskId}`} className="hover:text-indigo-600 transition-colors truncate max-w-40">
          {task?.name ?? 'Task'}
        </Link>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{offer.name}</span>
      </nav>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setOfferMainTab('details')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            offerMainTab === 'details'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40'
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setOfferMainTab('messages')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            offerMainTab === 'messages'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40'
          }`}
        >
          Messages
          <span className={offerMainTab === 'messages' ? 'text-indigo-100' : 'text-gray-400 font-normal'}>({offerEmails.length})</span>
        </button>
      </div>

      {offerMainTab === 'details' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{offer.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Task: {task?.name ?? taskId}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setMutationError(null)
                  setEditModal(true)
                }}
                disabled={pricingInProgress}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Edit offer
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={pricingInProgress}
                className="text-sm font-medium text-red-700 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h3>
              <div className="flex items-start justify-between gap-4">
                <p className="text-gray-700 whitespace-pre-wrap flex-1">{offer.description || '—'}</p>
                <button
                  type="button"
                  disabled={pricingInProgress}
                  onClick={() => {
                    setMutationError(null)
                    setDescriptionModal(true)
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex-shrink-0 disabled:opacity-50"
                >
                  Edit
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assignees</h3>
              <p className="text-gray-700">{offerAssigneesLabel(offer, teamMembers)}</p>
            </div>
            {isAdmin && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unit cost</h3>
                    <p className="text-gray-900 font-medium">{formatCurrency(offer.unitCost)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total</h3>
                    <p className="text-indigo-700 font-bold">{formatCurrency(offer.total)}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!offer.workCompleted}
                    disabled={pricingInProgress || updatingOffer}
                    onChange={() => {
                      setMutationError(null)
                      updateOffer({
                        variables: {
                          id: offer.id,
                          projectId,
                          taskId,
                          tenantId,
                          input: { workCompleted: !offer.workCompleted },
                        },
                      })
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Work complete</span>
                </label>
              </>
            )}
            {!isAdmin && (
              <p className="text-sm text-gray-600">
                Done:{' '}
                <span className={offer.workCompleted ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                  {offer.workCompleted ? 'Yes' : 'No'}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {offerMainTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Messages{' '}
                <span className="text-gray-400 font-normal text-sm ml-1">
                  ({filteredOfferEmails.length}
                  {emailSearch ? ` of ${offerEmails.length}` : ''})
                </span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!canMessageOfferAssignees || pricingInProgress) return
                  setMutationError(null)
                  setEmailModal({
                    modalKey: Date.now(),
                    recipients: offerRecipients,
                    defaultSubject: `Offer: ${offer.name}`,
                    defaultBody: `Hi,\n\nRegarding offer "${offer.name}" on task "${task?.name ?? ''}" (${project?.name ?? ''}):\n\n`,
                  })
                }}
                disabled={!canMessageOfferAssignees || pricingInProgress}
                title={
                  pricingInProgress
                    ? 'Project is locked during pricing'
                    : !canMessageOfferAssignees
                      ? 'No reachable assignees: add people on this offer, with email and/or phone on their profile'
                      : `${offerRecipients.length} assignee(s) (${offerWithEmail} with email, ${offerWithPhone} with text) — choose recipients in the modal`
                }
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Message assignees
              </button>
            </div>
            <p className="text-sm text-gray-500 -mt-1">
              Recipients are people assigned on this offer only. History shows messages sent from this offer.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setEmailSearch(emailSearchInput)
              }}
              className="flex flex-wrap gap-2 w-full max-w-xl"
            >
              <input
                value={emailSearchInput}
                onChange={(e) => setEmailSearchInput(e.target.value)}
                placeholder="Search subject, recipients, body…"
                className="flex-1 min-w-[12rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
              <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                Search
              </button>
              {emailSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailSearch('')
                    setEmailSearchInput('')
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
          <div className="p-6">
            {offerEmails.length === 0 ? (
              <EmptyState
                title="No messages for this offer yet"
                description="Use Message assignees when people are assigned on this offer (with email and/or phone on their profile)."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : filteredOfferEmails.length === 0 ? (
              <EmptyState
                title="No matching messages"
                description="Try a different search term."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredOfferEmails.map((e) => (
                  <ProjectMessageHistoryItem key={e.id} email={e} formatDate={formatDate} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit offer" maxWidth="max-w-2xl">
        <OfferForm
          key={offer.updatedAt ?? offer.id}
          initial={offer}
          teamMembers={teamMembers}
          isAdmin={isAdmin}
          onSubmit={(input) =>
            updateOffer({
              variables: { id: offer.id, projectId, taskId, tenantId, input },
            })
          }
          loading={updatingOffer}
          error={mutationError}
        />
      </Modal>

      <Modal
        open={descriptionModal}
        onClose={() => {
          setDescriptionModal(false)
          setMutationError(null)
        }}
        title={`Edit description — ${offer.name}`}
        maxWidth="max-w-2xl"
      >
        <DescriptionEditForm
          offer={offer}
          onSubmit={(description) =>
            updateOffer({
              variables: {
                id: offer.id,
                projectId,
                taskId,
                tenantId,
                input: {
                  name: offer.name,
                  description,
                  uom: offer.uom,
                  quantity: offer.quantity,
                  unitCost: offer.unitCost,
                  duration: offer.duration,
                  assigneeIds: offer.assigneeIds,
                },
              },
            })
          }
          onClose={() => {
            setDescriptionModal(false)
            setMutationError(null)
          }}
          loading={updatingOffer}
          error={mutationError}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={deletingOffer}
        title="Delete offer"
        message={`Are you sure you want to delete "${offer.name}"?`}
        onConfirm={() => deleteOffer({ variables: { id: offer.id, projectId, taskId, tenantId } })}
      />

      <EmailComposeModal
        key={emailModal?.modalKey ?? 'closed'}
        open={!!emailModal}
        onClose={() => {
          setEmailModal(null)
          setMutationError(null)
        }}
        recipients={emailModal?.recipients ?? []}
        defaultSubject={emailModal?.defaultSubject ?? ''}
        defaultBody={emailModal?.defaultBody ?? ''}
        sending={sendingEmail}
        error={mutationError}
        onSend={({ subject, body, sendEmail, sendSms, toEmails, toPhoneNumbers }) => {
          setMutationError(null)
          sendProjectEmail({
            variables: {
              input: {
                tenantId,
                projectId,
                taskId,
                offerId,
                senderId: user?.id,
                toEmails: sendEmail ? toEmails : [],
                toPhoneNumbers: sendSms ? toPhoneNumbers : [],
                sendEmail,
                sendSms,
                subject: sendEmail ? subject : null,
                body,
              },
            },
          })
        }}
      />
    </div>
  )
}
