import { useState } from 'react'
import type { QuizQuestion } from '../types'

interface Props {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  loading: boolean
}

export default function QuizCard({ question, onAnswer, loading }: Props) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    onAnswer(answer)
    setAnswer('')
  }

  const targetLang = question.source_language === 'english' ? 'Greek' : 'English'
  const progress = (question.question_number / question.total_questions) * 100

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-400">
          Question {question.question_number} of {question.total_questions}
        </span>
        <span className="text-sm font-semibold text-greek-blue">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
        <div
          className="bg-gradient-to-r from-greek-blue to-greek-blue-light h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mb-2 text-center">Translate to <strong className="text-gray-700">{targetLang}</strong></p>
      <p className="text-3xl font-bold text-center py-8 text-gray-800">{question.prompt}</p>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-lg mb-4 focus:border-greek-blue focus:ring-2 focus:ring-greek-blue/20"
          placeholder={`Type in ${targetLang}...`}
        />
        <button
          type="submit"
          disabled={loading || !answer.trim()}
          className="w-full bg-greek-blue text-white py-3.5 rounded-xl font-semibold hover:bg-greek-blue-dark disabled:opacity-40 transition shadow-sm"
        >
          Submit
        </button>
      </form>
    </div>
  )
}
