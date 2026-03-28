import { Link } from 'react-router-dom'

const footerLinks = {
  Product: [
    { label: 'Features', to: '/#features' },
    { label: 'Pricing', to: '#' },
    { label: 'Changelog', to: '#' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', to: '#' },
    { label: 'Terms', to: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-400">
              <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                <polygon points="16,2 30,28 2,28" fill="currentColor" opacity="0.2" />
                <polygon
                  points="16,2 30,28 2,28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="19" r="3" fill="currentColor" />
              </svg>
              Aether
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Project, labor &amp; estimate software for construction, trades, outdoor work, tutoring, and
              every service team that shows up and gets it done.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-4 text-sm font-semibold text-slate-200">{section}</h3>
              <ul className="space-y-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm transition-colors hover:text-indigo-400">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-sm">© {new Date().getFullYear()} Aether. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {['Twitter', 'GitHub', 'LinkedIn'].map((platform) => (
              <a key={platform} href="#" className="text-sm transition-colors hover:text-indigo-400">
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
