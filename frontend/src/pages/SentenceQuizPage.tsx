import { useQuiz } from '../hooks/useQuiz'
import QuizSetup from '../components/QuizSetup'
import QuizCard from '../components/QuizCard'
import QuizResult from '../components/QuizResult'
import SessionSummary from '../components/SessionSummary'

export default function SentenceQuizPage() {
  const quiz = useQuiz('sentence')

  if (quiz.phase === 'setup') {
    return <QuizSetup title="Sentence Quiz" quizType="sentence" onStart={quiz.start} loading={quiz.loading} error={quiz.error} />
  }

  if (quiz.phase === 'question' && quiz.question) {
    return <QuizCard question={quiz.question} onAnswer={quiz.answer} loading={quiz.loading} correctCount={quiz.correctCount} wrongCount={quiz.wrongCount} />
  }

  if (quiz.phase === 'result' && quiz.result) {
    return <QuizResult result={quiz.result} question={quiz.question?.prompt} onNext={quiz.next} />
  }

  if (quiz.phase === 'summary' && quiz.summary) {
    return <SessionSummary summary={quiz.summary} onRestart={quiz.reset} />
  }

  return null
}
