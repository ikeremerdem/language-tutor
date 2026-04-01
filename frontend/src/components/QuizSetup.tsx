import { useEffect, useState } from 'react'
import type { QuizType, RecentSession, SourceLanguage } from '../types'
import { getSessionsByType } from '../api/client'
import FilosLogo from './FilosLogo'
import { useTutor } from '../context/TutorContext'

interface Props {
  title: string
  quizType: QuizType
  onStart: (sourceLang: SourceLanguage, numQuestions: number) => void
  loading: boolean
  error: string | null
}

export default function QuizSetup({ title, quizType, onStart, loading, error }: Props) {
  const { tutorId, targetLanguage } = useTutor()
  const [sourceLang, setSourceLang] = useState<SourceLanguage>('english')
  const [numQuestions, setNumQuestions] = useState(10)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  useEffect(() => {
    getSessionsByType(tutorId, quizType).then(setRecentSessions).catch(() => {})
  }, [tutorId, quizType])

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-4"><FilosLogo size={52} /></div>
        <h2 className="text-2xl font-bold text-filos-primary mb-1">{title}</h2>
        <p className="text-gray-400 text-sm mb-8">Test your {targetLanguage} vocabulary</p>
        <div className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Show me the word in</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as SourceLanguage)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5"
            >
              <option value="english">English (translate to {targetLanguage})</option>
              <option value="target_language">{targetLanguage} (translate to English)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Number of questions</label>
            <input
              type="number" min={1} max={50} value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
          <button
            onClick={() => onStart(sourceLang, numQuestions)}
            disabled={loading}
            className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {loading ? 'Starting…' : 'Start Quiz →'}
          </button>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
          <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Recent Sessions</h3>
          <div className="space-y-1.5">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 bg-filos-marble rounded-lg hover:bg-filos-surface transition">
                <span className="text-sm text-gray-600">{s.correct_answers}/{s.total_questions} correct</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${s.score_percent >= 80 ? 'text-green-600' : s.score_percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {s.score_percent}%
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {s.ended_at ? new Date(s.ended_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
