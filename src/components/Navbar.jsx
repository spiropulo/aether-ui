import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/#features' },
  { label: 'Contact', to: '/contact' },
]

const marketingPaths = ['/', '/about', '/contact']

export default function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isMarketing = marketingPaths.includes(pathname)
  const transparent = isMarketing && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = ({ isActive }) => {
    if (transparent) {
      return `text-sm font-medium transition-colors ${
        isActive ? 'text-white' : 'text-white/75 hover:text-white'
      }`
    }
    return `text-sm font-medium transition-colors ${
      isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
    }`
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isMarketing ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          to="/"
          className={`flex items-center gap-2 text-xl font-bold transition-colors ${
            transparent ? 'text-white' : 'text-indigo-600'
          }`}
        >
          <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 30,28 2,28" fill="currentColor" opacity={transparent ? 0.25 : 0.15} />
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

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ label, to }) => (
            <NavLink key={label} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className={`text-sm font-medium transition-colors ${
              transparent ? 'text-white/85 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              transparent
                ? 'bg-white text-indigo-900 hover:bg-indigo-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className={`rounded-md p-2 md:hidden ${transparent ? 'text-white' : 'text-gray-600'}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/register"
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={() => setMenuOpen(false)}
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  )
}
