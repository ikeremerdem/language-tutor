import type { QuizSummary } from '../types'

interface Props {
  summary: QuizSummary
  onRestart: () => void
}

export default function SessionSummary({ summary, onRestart }: Props) {
  const score = summary.score_percent
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const ringColor = score >= 80 ? 'stroke-green-500' : score >= 50 ? 'stroke-amber-400' : 'stroke-red-400'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-10 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-filos-primary mb-6 font-headline">Quiz Complete!</h2>

      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#F0EDE8" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              className={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${score * 3.267} 326.7`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold font-headline ${scoreColor}`}>{score}%</span>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 mb-6">
        {summary.correct_answers} of {summary.total_questions} correct
      </p>

      <div className="space-y-2 mb-8 max-h-64 overflow-y-auto">
        {summary.details.map((d, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${d.correct ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-lg ${d.correct ? 'text-green-500' : 'text-red-400'}`}>
              {d.correct ? '✓' : '✗'}
            </span>
            <span className="flex-1 text-sm text-gray-700">
              {d.prompt} <span className="text-gray-400 mx-1">&rarr;</span> <span className="font-medium">{d.correct_answer}</span>
            </span>
            {!d.correct && (
              <span className="text-xs text-red-400 bg-red-100 px-2 py-0.5 rounded-full">{d.your_answer}</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark transition shadow-sm"
      >
        Play Again
      </button>
    </div>
  )
}
