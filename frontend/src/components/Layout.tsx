import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, Outlet, useParams, useNavigate } from 'react-router-dom'
import FilosLogo from './FilosLogo'
import { useTutor } from '../context/TutorContext'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../hooks/useIsAdmin'


export default function Layout() {
  const { tutorId, targetLanguage } = useTutor()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const { tutorId: paramId } = useParams<{ tutorId: string }>()
  const navigate = useNavigate()
  const id = tutorId || paramId || ''

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tutorLink = (path: string) => id ? `/tutors/${id}/${path}` : '/tutors'

  const links = [
    { to: tutorLink('dashboard'), label: 'Dashboard' },
    { to: tutorLink('vocabulary'), label: 'Vocabulary' },
    { to: tutorLink('quiz/word'), label: 'Word Quiz' },
    { to: tutorLink('quiz/sentence'), label: 'Sentence Quiz' },
    { to: tutorLink('conversation'), label: 'Conversation' },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'text-filos-primary bg-filos-marble font-semibold'
        : 'text-gray-500 hover:text-filos-primary hover:bg-filos-marble'
    }`

  return (
    <div className="min-h-screen bg-filos-marble">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Logo */}
          <button onClick={() => navigate('/tutors')} className="flex items-center gap-3 hover:opacity-80 transition flex-shrink-0">
            <FilosLogo size={38} />
            <div className="leading-tight text-left">
              <h1 className="text-xl font-bold tracking-tight text-filos-primary font-headline">Filos</h1>
              <p className="text-filos-accent text-xs italic">{targetLanguage ? `Your ${targetLanguage} companion` : 'Language tutor'}</p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* User dropdown (desktop) */}
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-filos-marble transition"
              >
                <div className="w-7 h-7 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-filos-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 max-w-[140px] truncate">{user?.email}</span>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link to="/tutors" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Switch Language</Link>
                  <Link to="/packages" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Packages</Link>
                  <Link to={tutorLink('preferences')} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Preferences</Link>
                  <Link to={tutorLink('release-notes')} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Release Notes</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Admin</Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin/personas" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Personas</Link>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={() => { setMenuOpen(false); signOut() }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Sign out</button>
                </div>
              )}
            </div>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileNavOpen((o) => !o)}
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-filos-marble transition"
              aria-label="Menu"
            >
              {mobileNavOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'text-filos-primary bg-filos-marble font-semibold' : 'text-gray-600 hover:text-filos-primary hover:bg-filos-marble'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <Link to="/tutors" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Switch Language</Link>
              <Link to="/packages" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Packages</Link>
              <Link to={tutorLink('preferences')} onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Preferences</Link>
              <Link to={tutorLink('release-notes')} onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Release Notes</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Admin</Link>
              )}
              {isAdmin && (
                <Link to="/admin/personas" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">Personas</Link>
              )}
              <button onClick={() => { setMobileNavOpen(false); signOut() }} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition">
                Sign out — <span className="text-gray-400">{user?.email}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 px-6 space-y-1">
        <p>Filos &middot; {targetLanguage ? `Your ${targetLanguage} companion` : 'Language tutor'} &middot; Powered by kaloma.ai</p>
        <p className="text-gray-300 max-w-2xl mx-auto">
          This is a pet project by Kerem Erdem, maintained on a best-effort basis. It has not undergone a security audit,
          does not guarantee GDPR compliance, and is provided as-is. Use at your own risk.
          For feedback and feature requests, contact{' '}
          <a href="mailto:languagetutor@kaloma.ai" className="hover:text-gray-400 transition underline">languagetutor@kaloma.ai</a>.
        </p>
      </footer>
    </div>
  )
}
