import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom'
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

  const links = [
    { to: `/tutors/${id}/dashboard`, label: 'Dashboard' },
    { to: `/tutors/${id}/vocabulary`, label: 'Vocabulary' },
    { to: `/tutors/${id}/quiz/word`, label: 'Word Quiz' },
    { to: `/tutors/${id}/quiz/sentence`, label: 'Sentence Quiz' },
  ]

  return (
    <div className="min-h-screen bg-filos-marble">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tutors')} className="flex items-center gap-3 hover:opacity-80 transition">
              <FilosLogo size={38} />
              <div className="leading-tight text-left">
                <h1 className="text-xl font-bold tracking-tight text-filos-primary font-headline">Filos</h1>
                <p className="text-filos-accent text-xs italic">Your {targetLanguage} companion</p>
              </div>
            </button>
          </div>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-filos-primary bg-filos-marble font-semibold'
                      : 'text-gray-500 hover:text-filos-primary hover:bg-filos-marble'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <NavLink
                to="/admin"
                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition"
              >
                Admin
              </NavLink>
            )}
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-filos-primary font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 px-6 space-y-1">
        <p>Filos &middot; Your {targetLanguage} companion &middot; Powered by kaloma.ai</p>
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
