import Modal from './Modal'
import Spinner from './Spinner'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  loadingLabel,
  loading = false,
  variant = 'danger', // 'danger' (red) or 'neutral' (gray)
}) {
  const loadingText = loadingLabel ?? (confirmLabel?.replace(/\.$/, '') + '…')
  const confirmClass = variant === 'neutral'
    ? 'bg-gray-700 hover:bg-gray-800'
    : 'bg-red-600 hover:bg-red-700'
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 ${confirmClass}`}
        >
          {loading && <Spinner size="sm" />}
          {loading ? loadingText : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
