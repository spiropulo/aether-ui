import { useLocation } from 'react-router-dom'

const SCREENS = [
  // Most specific routes first
  { pattern: /^\/app\/projects\/[^/]+\/tasks\/[^/]+$/, label: 'Task Detail' },
  { pattern: /^\/app\/projects\/[^/]+$/, label: 'Project Detail' },
  { pattern: /^\/app\/team\/[^/]+$/, label: 'User Detail' },
  { pattern: /^\/app\/admin\/tenants$/, label: 'Admin · Organization' },
  { pattern: /^\/app\/estimate$/, label: 'Admin · Estimate from PDF' },
  { pattern: /^\/app\/pdf-uploads$/, label: 'Admin · PDF Uploads' },
  { pattern: /^\/app\/dashboard$/, label: 'Dashboard' },
  { pattern: /^\/app\/projects$/, label: 'Projects' },
  { pattern: /^\/app\/team$/, label: 'Team' },
  { pattern: /^\/app\/training$/, label: 'AI Training' },
  { pattern: /^\/app\/settings$/, label: 'Settings' },
  { pattern: /^\/login$/, label: 'Login' },
  { pattern: /^\/register$/, label: 'Register' },
  { pattern: /^\/$/, label: 'Home' },
  { pattern: /^\/about$/, label: 'About' },
  { pattern: /^\/contact$/, label: 'Contact' },
]

function getScreenLabel(pathname) {
  for (const { pattern, label } of SCREENS) {
    if (pattern.test(pathname)) return label
  }
  return pathname
}

export default function DevLabel() {
  const { pathname } = useLocation()

  if (!import.meta.env.DEV) return null

  const label = getScreenLabel(pathname)

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed top-4 right-4 flex flex-col items-end gap-1"
    >
      <div className="flex items-center gap-2 bg-gray-950/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-lg cursor-text">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
        <span className="text-xs font-semibold tracking-wide select-all">{label}</span>
      </div>
      <div className="bg-gray-950/60 backdrop-blur-sm text-gray-400 px-3 py-1 rounded-md cursor-text">
        <span className="text-[10px] font-mono select-all">{pathname}</span>
      </div>
    </div>
  )
}
