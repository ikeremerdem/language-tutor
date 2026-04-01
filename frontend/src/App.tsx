import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import VocabularyPage from './pages/VocabularyPage'
import WordQuizPage from './pages/WordQuizPage'
import SentenceQuizPage from './pages/SentenceQuizPage'
import DashboardPage from './pages/DashboardPage'
import { LanguageContext } from './context/LanguageContext'
import type { AppConfig } from './types'
import { fetchConfig } from './api/client'

function App() {
  const [config, setConfig] = useState<AppConfig>({ target_language: 'Greek' })

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {})
  }, [])

  return (
    <LanguageContext.Provider value={config}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/quiz/word" element={<WordQuizPage />} />
            <Route path="/quiz/sentence" element={<SentenceQuizPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageContext.Provider>
  )
}

export default App
