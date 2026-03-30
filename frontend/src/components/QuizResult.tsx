import type { QuizAnswerResult } from '../types'

interface Props {
  result: QuizAnswerResult
  question?: string
  onNext: () => void
}

export default function QuizResult({ result, question, onNext }: Props) {
  const isCorrect = result.correct

  return (
    <div className="bg-white rounded-2xl shadow-sm p-10 max-w-lg mx-auto text-center">
      <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl font-bold ${
        isCorrect ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
      }`}>
        {isCorrect ? '✓' : '✗'}
      </div>
      <h3 className={`text-2xl font-bold mb-5 font-headline ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
        {isCorrect ? 'Correct!' : 'Not quite!'}
      </h3>

      {question && (
        <div className="bg-filos-marble rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Question</p>
          <p className="text-lg font-semibold text-filos-primary font-headline">{question}</p>
        </div>
      )}

      <div className={`rounded-xl p-4 mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your answer</p>
        <p className={`text-lg font-medium ${isCorrect ? 'text-green-700' : 'text-red-600 line-through decoration-red-300'}`}>
          {result.your_answer}
        </p>
      </div>

      {!isCorrect && (
        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Correct answer</p>
          <p className="text-lg font-bold text-green-700">{result.correct_answer}</p>
        </div>
      )}

      {result.notes && (
        <p className="text-gray-500 text-sm italic mb-2">{result.notes}</p>
      )}
      {result.explanation && (
        <p className="text-gray-400 text-sm mb-5">{result.explanation}</p>
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
