import { Link } from 'react-router-dom'

const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
    'Blog',
    'Careers',
  ],
  Legal: ['Privacy', 'Terms', 'Cookie Policy'],
}

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-400">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
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
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Empowering the next generation of digital experiences.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-gray-200 mb-4">{section}</h3>
              <ul className="space-y-3">
                {links.map((link) => {
                  const label = typeof link === 'string' ? link : link.label
                  const to = typeof link === 'string' ? '#' : link.to
                  return (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm hover:text-indigo-400 transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Aether. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {['Twitter', 'GitHub', 'LinkedIn'].map((platform) => (
              <a
                key={platform}
                href="#"
                className="text-sm hover:text-indigo-400 transition-colors"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
