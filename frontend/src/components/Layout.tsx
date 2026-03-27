import { NavLink, Outlet } from 'react-router-dom'
import GreekFlag from './GreekFlag'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vocabulary', label: 'Vocabulary' },
  { to: '/quiz/word', label: 'Word Quiz' },
  { to: '/quiz/sentence', label: 'Sentence Quiz' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-greek-sky">
      <header className="bg-gradient-to-r from-greek-blue to-greek-blue-light text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GreekFlag className="w-10 h-7 rounded shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Greek Tutor</h1>
              <p className="text-blue-200 text-xs tracking-wide">Learn Modern Greek</p>
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
                      ? 'bg-white/20 shadow-inner'
                      : 'hover:bg-white/10'
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
        Greek Tutor &middot; Powered by AI
      </footer>
    </div>
  )
}
