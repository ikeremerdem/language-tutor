import type { QuizAnswerResult } from '../types'

interface Props {
  result: QuizAnswerResult
  onNext: () => void
}

export default function QuizResult({ result, onNext }: Props) {
  const isCorrect = result.correct

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-lg mx-auto text-center">
      <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl font-bold ${
        isCorrect ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
      }`}>
        {isCorrect ? '✓' : '✗'}
      </div>
      <h3 className={`text-2xl font-bold mb-5 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
        {isCorrect ? 'Correct!' : 'Incorrect'}
      </h3>
      <div className={`rounded-xl p-5 mb-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
        {!isCorrect && (
          <p className="text-gray-600 mb-2">
            Your answer: <span className="font-medium line-through decoration-red-300">{result.your_answer}</span>
          </p>
        )}
        <p className="text-gray-700 text-lg">
          {isCorrect ? 'Answer' : 'Correct answer'}: <span className="font-bold text-green-700">{result.correct_answer}</span>
        </p>
        {result.notes && (
          <p className="text-gray-500 text-sm italic mt-2">{result.notes}</p>
        )}
      </div>
      {result.explanation && (
        <p className="text-gray-400 text-sm mb-5">{result.explanation}</p>
      )}
      <button
        onClick={onNext}
        className="bg-greek-blue text-white px-10 py-3 rounded-xl font-semibold hover:bg-greek-blue-dark transition shadow-sm"
      >
        Next
      </button>
    </div>
  )
}
