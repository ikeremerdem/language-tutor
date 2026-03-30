import { NavLink, Outlet } from 'react-router-dom'
import FilosLogo from './FilosLogo'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vocabulary', label: 'Vocabulary' },
  { to: '/quiz/word', label: 'Word Quiz' },
  { to: '/quiz/sentence', label: 'Sentence Quiz' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-filos-marble">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilosLogo size={38} />
            <div className="leading-tight">
              <h1 className="text-xl font-bold tracking-tight text-filos-primary font-headline">Filos</h1>
              <p className="text-filos-accent text-xs italic">Your Greek companion</p>
            </div>
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
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-400 py-6">
        Filos &middot; Your Greek companion &middot; Powered by AI
      </footer>
    </div>
  )
}
