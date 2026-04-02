import { useEffect, useState } from 'react'
import type { QuizType, QuizFocus, RecentSession, SourceLanguage, WordStatusCounts } from '../types'
import { getSessionsByType, getDashboard } from '../api/client'
import FilosLogo from './FilosLogo'
import CategoryPill from './CategoryPill'
import { useTutor } from '../context/TutorContext'

interface Props {
  title: string
  quizType: QuizType
  onStart: (sourceLang: SourceLanguage, numQuestions: number, focus: QuizFocus) => void
  loading: boolean
  error: string | null
}

const FOCUS_OPTIONS: { value: QuizFocus; label: string; description: string }[] = [
  { value: 'balanced', label: 'Balanced', description: 'Mix of all words' },
  { value: 'new_words', label: 'New words', description: 'Never practiced' },
  { value: 'struggling', label: 'Struggling', description: 'Streak is zero' },
]

export default function QuizSetup({ title, quizType, onStart, loading, error }: Props) {
  const { tutorId, targetLanguage } = useTutor()
  const [sourceLang, setSourceLang] = useState<SourceLanguage>('english')
  const [numQuestions, setNumQuestions] = useState(10)
  const [focus, setFocus] = useState<QuizFocus>('balanced')
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [wordStatus, setWordStatus] = useState<WordStatusCounts | null>(null)

  useEffect(() => {
    getSessionsByType(tutorId, quizType).then(setRecentSessions).catch(() => {})
    if (quizType === 'word') {
      getDashboard(tutorId).then((s) => setWordStatus(s.word_status)).catch(() => {})
    }
  }, [tutorId, quizType])

  const fromLang = sourceLang === 'english' ? 'English' : targetLanguage
  const toLang = sourceLang === 'english' ? targetLanguage : 'English'
  const toggleDirection = () =>
    setSourceLang((l) => (l === 'english' ? 'target_language' : 'english'))

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-4"><FilosLogo size={52} /></div>
        <h2 className="text-2xl font-bold text-filos-primary mb-1">{title}</h2>
        <p className="text-gray-400 text-sm mb-8">Test your {targetLanguage} vocabulary</p>

        <div className="space-y-6 text-left">

          {/* Direction toggle */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Translation direction</p>
            <button
              type="button"
              onClick={toggleDirection}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-filos-primary/20 hover:border-filos-primary/50 bg-filos-marble hover:bg-filos-surface transition group"
            >
              <span className="font-semibold text-gray-800">{fromLang}</span>
              <span className="flex items-center gap-1.5 text-filos-primary group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">swap</span>
              </span>
              <span className="font-semibold text-gray-800">{toLang}</span>
            </button>
          </div>

          {/* Focus pills — word quiz only */}
          {quizType === 'word' && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Focus</p>
              <div className="grid grid-cols-3 gap-2">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFocus(opt.value)}
                    className={`flex flex-col items-center px-3 py-3 rounded-xl border-2 text-center transition ${
                      focus === opt.value
                        ? 'border-filos-primary bg-filos-primary/5 text-filos-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                    <span className="text-xs mt-0.5 opacity-70 leading-tight">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Number of questions */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Number of questions</p>
            <div className="flex items-center gap-3">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    numQuestions === n
                      ? 'border-filos-primary bg-filos-primary/5 text-filos-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={100}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-16 border-2 border-gray-200 rounded-xl px-2 py-2.5 text-sm text-center font-semibold text-gray-600 focus:border-filos-primary focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          <button
            onClick={() => onStart(sourceLang, numQuestions, focus)}
            disabled={loading}
            className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {loading ? 'Starting…' : 'Start Quiz →'}
          </button>
        </div>
      </div>

      {(wordStatus || recentSessions.length > 0) && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {wordStatus && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Vocabulary Status</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left font-medium text-gray-500">Status</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Words</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(['new', 'struggling', 'learning', 'learned'] as const).map((cat) => (
                    <tr key={cat}>
                      <td className="py-2"><CategoryPill category={cat} /></td>
                      <td className="py-2 text-right font-medium text-gray-700">{wordStatus[cat]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentSessions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
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
      )}
    </div>
  )
}
