import { useState } from 'react'

export default function ProjectMessageHistoryItem({ email: e, formatDate }) {
  const [expanded, setExpanded] = useState(false)
  const channels = (e.deliveryChannels ?? ['EMAIL']).join(' + ')
  const emailList = e.toEmails ?? []
  const phoneList = e.toPhoneNumbers ?? []
  const hasRecipients = emailList.length > 0 || phoneList.length > 0
  const body = (e.body ?? '').trim()
  const hasBody = body.length > 0
  const showMetaRow = hasRecipients || e.taskId || e.offerId
  const canExpand = hasBody || showMetaRow

  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{channels}</p>
          <p className="text-sm font-medium text-gray-900">{e.subject}</p>
          {showMetaRow &&
            (expanded ? (
              <div className="text-xs text-gray-500 mt-1 space-y-1.5 break-words">
                {emailList.length > 0 && (
                  <p>
                    <span className="font-medium text-gray-600">Email </span>
                    {emailList.join(', ')}
                  </p>
                )}
                {phoneList.length > 0 && (
                  <p>
                    <span className="font-medium text-gray-600">Text </span>
                    {phoneList.join(', ')}
                  </p>
                )}
                {e.offerId && <p className="text-indigo-600">(offer assignees)</p>}
                {!e.offerId && e.taskId && <p className="text-indigo-600">(task assignees)</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">
                {emailList.length > 0 && <span>Email: {emailList.join(', ')}</span>}
                {emailList.length > 0 && phoneList.length > 0 && <span className="mx-1">·</span>}
                {phoneList.length > 0 && <span>Text: {phoneList.join(', ')}</span>}
                {e.offerId && (
                  <span className={hasRecipients ? 'ml-2 text-indigo-600' : 'text-indigo-600'}>
                    (offer assignees)
                  </span>
                )}
                {!e.offerId && e.taskId && (
                  <span className={hasRecipients ? 'ml-2 text-indigo-600' : 'text-indigo-600'}>
                    (task assignees)
                  </span>
                )}
              </p>
            ))}
          {hasBody && (
            <p
              className={`text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words ${
                expanded ? '' : 'line-clamp-3'
              }`}
            >
              {body}
            </p>
          )}
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((x) => !x)}
              className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              {expanded ? 'Show less' : 'Show full message'}
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{e.sentAt ? formatDate(e.sentAt) : '—'}</span>
      </div>
    </div>
  )
}
