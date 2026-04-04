import { Link } from 'react-router-dom'
import type { QuizAnswerResult } from '../types'
import { useTutor } from '../context/TutorContext'

interface Props {
  result: QuizAnswerResult
  question?: string
  onNext: () => void
}

export default function QuizResult({ result, question, onNext }: Props) {
  const { tutorId } = useTutor()
  const isAlmostCorrect = result.correct && !!result.explanation
  const isFullyCorrect = result.correct && !result.explanation
  const isWrong = !result.correct

  const heading = isFullyCorrect ? 'Correct!' : isAlmostCorrect ? 'Almost Correct!' : 'Wrong!'
  const headingColor = isFullyCorrect ? 'text-green-600' : isAlmostCorrect ? 'text-amber-500' : 'text-red-600'
  const iconBg = isFullyCorrect ? 'bg-green-50 text-green-500' : isAlmostCorrect ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
  const icon = isFullyCorrect ? '✓' : isAlmostCorrect ? '≈' : '✗'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-10 max-w-lg mx-auto text-center">
      <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl font-bold ${iconBg}`}>
        {icon}
      </div>
      <h3 className={`text-2xl font-bold mb-5 font-headline ${headingColor}`}>
        {heading}
      </h3>

      {question && (
        <div className="bg-filos-marble rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Question</p>
          <p className="text-lg font-semibold text-filos-primary font-headline">{question}</p>
        </div>
      )}

      <div className={`rounded-xl p-4 mb-4 ${isFullyCorrect ? 'bg-green-50' : isAlmostCorrect ? 'bg-amber-50' : 'bg-red-50'}`}>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your answer</p>
        <p className={`text-lg font-medium ${isFullyCorrect ? 'text-green-700' : isAlmostCorrect ? 'text-amber-600 line-through decoration-amber-300' : 'text-red-600 line-through decoration-red-300'}`}>
          {result.your_answer}
        </p>
      </div>

      {(isWrong || isAlmostCorrect) && (
        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Correct answer</p>
          <p className="text-lg font-bold text-green-700">{result.correct_answer}</p>
          {isAlmostCorrect && result.explanation && (
            <p className="text-xs text-amber-600 mt-2">
              {result.explanation}{' '}
              You can turn off leniency in{' '}
              <Link to={`/tutors/${tutorId}/preferences`} className="underline hover:text-amber-700">
                Preferences
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {result.notes && (
        <p className="text-gray-500 text-sm italic mb-5">{result.notes}</p>
      )}

      <button
        onClick={onNext}
        className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark transition shadow-sm"
      >
        Next Question →
      </button>
    </div>
  )
}
