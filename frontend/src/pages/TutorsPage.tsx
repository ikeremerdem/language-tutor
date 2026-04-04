import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LanguageTutor } from '../types'
import { getTutors, createTutor, deleteTutor } from '../api/client'
import { useAuth } from '../context/AuthContext'
import FilosLogo from '../components/FilosLogo'
import { useIsAdmin } from '../hooks/useIsAdmin'

const SUPPORTED_LANGUAGES = ['Greek', 'German', 'Spanish', 'Italian', 'French']

const LANGUAGE_FLAGS: Record<string, string> = {
  Greek: '🇬🇷',
  German: '🇩🇪',
  Spanish: '🇪🇸',
  Italian: '🇮🇹',
  French: '🇫🇷',
}

export default function TutorsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const [tutors, setTutors] = useState<LanguageTutor[]>([])
  const [creating, setCreating] = useState(false)
  const [selectedLang, setSelectedLang] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = () => getTutors().then(setTutors).catch(() => {})

  useEffect(() => { load() }, [])

  const existingLanguages = tutors.map((t) => t.language)
  const availableLanguages = SUPPORTED_LANGUAGES.filter((l) => !existingLanguages.includes(l))

  const handleCreate = async () => {
    if (!selectedLang) return
    setLoading(true)
    setError('')
    try {
      await createTutor(selectedLang)
      await load()
      setCreating(false)
      setSelectedLang('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tutorId: string) => {
    await deleteTutor(tutorId)
    await load()
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-filos-marble">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilosLogo size={36} />
            <h1 className="text-xl font-bold text-filos-primary font-headline">Filos</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition"
              >
                Admin
              </button>
            )}
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-filos-primary font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-filos-primary font-headline">My Language Tutors</h2>
            <p className="text-gray-400 text-sm mt-1">Each tutor has its own vocabulary and quiz history</p>
          </div>
          {availableLanguages.length > 0 && (
            <button
              onClick={() => { setCreating(true); setSelectedLang(availableLanguages[0]) }}
              className="bg-filos-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark transition shadow-sm"
            >
              + New Tutor
            </button>
          )}
        </div>

        {creating && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-base font-semibold text-filos-primary mb-4 font-headline">Choose a language</h3>
            <div className="flex gap-3 flex-wrap mb-4">
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-medium transition ${
                    selectedLang === lang
                      ? 'border-filos-primary bg-filos-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-filos-primary'
                  }`}
                >
                  <span className="text-xl">{LANGUAGE_FLAGS[lang]}</span>
                  {lang}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading || !selectedLang}
                className="bg-filos-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark disabled:opacity-40 transition"
              >
                {loading ? 'Creating…' : 'Create Tutor'}
              </button>
              <button
                onClick={() => { setCreating(false); setError('') }}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tutors.length === 0 && !creating ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No tutors yet</p>
            <p className="text-sm">Create your first language tutor to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{LANGUAGE_FLAGS[tutor.language] ?? '🌍'}</span>
                  <div>
                    <h3 className="text-lg font-bold text-filos-primary font-headline">{tutor.language}</h3>
                    <p className="text-xs text-gray-400">
                      Since {new Date(tutor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/tutors/${tutor.id}/dashboard`)}
                    className="flex-1 bg-filos-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-filos-primary-dark transition"
                  >
                    Enter
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(tutor.id)}
                    className="px-3 py-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete tutor"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.797l-.375 5a.75.75 0 0 1-1.495-.112l.375-5a.75.75 0 0 1 .795-.684Zm3.635.684a.75.75 0 1 0-1.495.112l.375 5a.75.75 0 1 0 1.495-.112l-.375-5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this tutor?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete all vocabulary and quiz history for this tutor.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-gray-400 py-6 px-6 space-y-1">
        <p>Filos &middot; Your language companion &middot; Powered by kaloma.ai</p>
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
