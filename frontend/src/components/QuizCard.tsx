import { useState } from 'react'
import type { QuizQuestion } from '../types'
import { useTutor } from '../context/TutorContext'

interface Props {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  loading: boolean
  correctCount: number
  wrongCount: number
}

export default function QuizCard({ question, onAnswer, loading, correctCount, wrongCount }: Props) {
  const { targetLanguage: target_language } = useTutor()
  const [answer, setAnswer] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    onAnswer(answer)
    setAnswer('')
  }

  const targetLang = question.source_language === 'english' ? target_language : 'English'
  const progress = (question.question_number / question.total_questions) * 100

  return (
    <div className="bg-white rounded-2xl shadow-sm p-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-400">
          Question {question.question_number} of {question.total_questions}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-green-600">{correctCount} correct</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-red-500">{wrongCount} wrong</span>
        </div>
      </div>
      <div className="w-full bg-filos-surface rounded-full h-1.5 mb-8">
        <div
          className="bg-filos-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mb-2 text-center uppercase tracking-widest">Translate to <strong className="text-gray-600 normal-case tracking-normal">{targetLang}</strong></p>
      <p className="text-4xl font-bold text-center py-8 text-filos-primary font-headline">{question.prompt}</p>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-lg mb-4 focus:border-filos-primary focus:ring-2 focus:ring-filos-primary/20"
          placeholder={`Type in ${targetLang}...`}
        />
        <button
          type="submit"
          disabled={loading || !answer.trim()}
          className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
        >
          Check Answer →
        </button>
      </form>
    </div>
  )
}
