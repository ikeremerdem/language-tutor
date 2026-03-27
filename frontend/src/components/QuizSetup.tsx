import { useState } from 'react'
import type { SourceLanguage } from '../types'
import GreekFlag from './GreekFlag'

interface Props {
  title: string
  onStart: (sourceLang: SourceLanguage, numQuestions: number) => void
  loading: boolean
  error: string | null
}

export default function QuizSetup({ title, onStart, loading, error }: Props) {
  const [sourceLang, setSourceLang] = useState<SourceLanguage>('english')
  const [numQuestions, setNumQuestions] = useState(10)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md mx-auto text-center">
      <GreekFlag className="w-14 h-10 rounded shadow-sm mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-gray-400 text-sm mb-8">Test your Greek vocabulary</p>
      <div className="space-y-5 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Show me the word in</label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as SourceLanguage)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
          >
            <option value="english">English (translate to Greek)</option>
            <option value="greek">Greek (translate to English)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Number of questions</label>
          <input
            type="number"
            min={1}
            max={50}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
          />
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
        <button
          onClick={() => onStart(sourceLang, numQuestions)}
          disabled={loading}
          className="w-full bg-greek-blue text-white py-3 rounded-lg font-semibold hover:bg-greek-blue-dark disabled:opacity-40 transition shadow-sm"
        >
          {loading ? 'Starting...' : 'Start Quiz'}
        </button>
      </div>
    </div>
  )
}
