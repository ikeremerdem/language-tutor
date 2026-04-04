import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import TutorLayout from './components/TutorLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TutorsPage from './pages/TutorsPage'
import DashboardPage from './pages/DashboardPage'
import VocabularyPage from './pages/VocabularyPage'
import WordQuizPage from './pages/WordQuizPage'
import SentenceQuizPage from './pages/SentenceQuizPage'
import AdminPage from './pages/AdminPage'
import PackagesPage from './pages/PackagesPage'
import PreferencesPage from './pages/PreferencesPage'
import ReleaseNotesPage from './pages/ReleaseNotesPage'
import PersistentLayout from './components/PersistentLayout'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-filos-marble flex items-center justify-center text-gray-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tutors" element={<AuthGuard><TutorsPage /></AuthGuard>} />
      <Route path="/tutors/:tutorId" element={<AuthGuard><TutorLayout /></AuthGuard>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vocabulary" element={<VocabularyPage />} />
        <Route path="quiz/word" element={<WordQuizPage />} />
        <Route path="quiz/sentence" element={<SentenceQuizPage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="release-notes" element={<ReleaseNotesPage />} />
      </Route>
      <Route path="/packages" element={<AuthGuard><PersistentLayout /></AuthGuard>}>
        <Route index element={<PackagesPage />} />
      </Route>
      <Route path="/admin" element={<AuthGuard><PersistentLayout /></AuthGuard>}>
        <Route index element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tutors" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
