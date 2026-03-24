import { useState, useEffect, useMemo } from 'react'
import Spinner from './ui/Spinner'
import Alert from './ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

const checkboxClass =
  'rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'

function initialSelection(recipients) {
  return new Set(recipients.filter((r) => r.email || r.phoneE164).map((r) => r.id))
}

function initialChannels(recipients) {
  const reachable = recipients.filter((r) => r.email || r.phoneE164)
  const anyE = reachable.some((r) => r.email)
  const anyP = reachable.some((r) => r.phoneE164)
  if (anyE && anyP) return { sendEmail: true, sendSms: true }
  if (anyE) return { sendEmail: true, sendSms: false }
  if (anyP) return { sendEmail: false, sendSms: true }
  return { sendEmail: false, sendSms: false }
}

/**
 * Compose project/task messages: pick assignees, then email and/or SMS.
 * @param {Array<{ id: string, displayName: string, email: string|null, phoneE164: string|null }>} recipients
 */
export default function EmailComposeModal({
  open,
  onClose,
  recipients = [],
  defaultSubject = '',
  defaultBody = '',
  onSend,
  sending,
  error,
}) {
  const [selectedIds, setSelectedIds] = useState(() => initialSelection(recipients))
  const ch0 = initialChannels(recipients)
  const [sendEmail, setSendEmail] = useState(ch0.sendEmail)
  const [sendSms, setSendSms] = useState(ch0.sendSms)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)

  const selectedEmailList = useMemo(
    () => [...new Set(recipients.filter((r) => selectedIds.has(r.id) && r.email).map((r) => r.email))],
    [recipients, selectedIds],
  )

  const selectedPhoneList = useMemo(
    () => [...new Set(recipients.filter((r) => selectedIds.has(r.id) && r.phoneE164).map((r) => r.phoneE164))],
    [recipients, selectedIds],
  )

  useEffect(() => {
    if (!open) return
    if (selectedEmailList.length === 0 && sendEmail) setSendEmail(false)
    if (selectedPhoneList.length === 0 && sendSms) setSendSms(false)
  }, [open, selectedEmailList.length, selectedPhoneList.length, sendEmail, sendSms])

  const toggleMember = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllReachable = () => {
    setSelectedIds(new Set(recipients.filter((r) => r.email || r.phoneE164).map((r) => r.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!sendEmail && !sendSms) return
    if (sendEmail && !subject.trim()) return
    if (sendSms && !body.trim()) return
    if (sendEmail && selectedEmailList.length === 0) return
    if (sendSms && selectedPhoneList.length === 0) return
    onSend({
      subject: subject.trim(),
      body: body.trim(),
      sendEmail,
      sendSms,
      toEmails: selectedEmailList,
      toPhoneNumbers: selectedPhoneList,
    })
  }

  if (!open) return null

  const reachable = recipients.filter((r) => r.email || r.phoneE164)
  const anyPoolEmail = recipients.some((r) => r.email)
  const anyPoolPhone = recipients.some((r) => r.phoneE164)

  const canSubmit =
    (sendEmail || sendSms) &&
    (!sendEmail || (selectedEmailList.length > 0 && subject.trim())) &&
    (!sendSms || (selectedPhoneList.length > 0 && body.trim())) &&
    selectedIds.size > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Message team</h2>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && <Alert message={error} />}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Members</label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  disabled={sending || reachable.length === 0}
                  onClick={selectAllReachable}
                  className="font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={clearSelection}
                  className="font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 max-h-52 overflow-y-auto divide-y divide-gray-100">
              {recipients.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No assignees on this project or task.</p>
              ) : (
                recipients.map((r) => {
                  const hasContact = !!(r.email || r.phoneE164)
                  const checked = selectedIds.has(r.id)
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-white/80 ${!hasContact ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        className={`${checkboxClass} mt-0.5 flex-shrink-0`}
                        checked={checked}
                        disabled={sending || !hasContact}
                        onChange={() => hasContact && toggleMember(r.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{r.displayName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 space-x-2">
                          {r.email ? <span>Email: {r.email}</span> : <span className="text-amber-700">No email</span>}
                          <span className="text-gray-300">·</span>
                          {r.phoneE164 ? <span>Text: {r.phoneE164}</span> : <span className="text-amber-700">No phone</span>}
                        </p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedIds.size} selected · {selectedEmailList.length} email · {selectedPhoneList.length} text
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Deliver via</label>
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-2 ${!anyPoolEmail || selectedEmailList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={sendEmail}
                  disabled={sending || !anyPoolEmail || selectedEmailList.length === 0}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span className="text-sm text-gray-800">Email</span>
              </label>
              <label className={`flex items-center gap-2 ${!anyPoolPhone || selectedPhoneList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={sendSms}
                  disabled={sending || !anyPoolPhone || selectedPhoneList.length === 0}
                  onChange={(e) => setSendSms(e.target.checked)}
                />
                <span className="text-sm text-gray-800">Text (SMS)</span>
              </label>
            </div>
            {!anyPoolPhone && (
              <p className="text-xs text-gray-500">Add phone numbers on team member profiles to enable text.</p>
            )}
          </div>
          {sendEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line"
                required={sendEmail}
                disabled={sending}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message{sendSms ? ' *' : ''}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={sendSms ? 'Message body (used for SMS and email when both are on)…' : 'Email body…'}
              rows={6}
              disabled={sending}
              required={sendSms}
              className={inputClass}
            />
            {sendSms && (
              <p className="text-xs text-gray-500 mt-1">SMS limit 1,600 characters (server-enforced).</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !canSubmit}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Spinner size="sm" />
                  Sending…
                </>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
