import { useState, useCallback } from 'react'
import type { QuizType, SourceLanguage, QuizQuestion, QuizAnswerResult, QuizSummary } from '../types'
import { startQuiz, getNextQuestion, submitAnswer, endQuiz } from '../api/client'

type QuizPhase = 'setup' | 'question' | 'result' | 'summary'

interface QuizState {
  phase: QuizPhase
  sessionId: string | null
  question: QuizQuestion | null
  result: QuizAnswerResult | null
  summary: QuizSummary | null
  loading: boolean
  error: string | null
  correctCount: number
  wrongCount: number
}

export function useQuiz(quizType: QuizType) {
  const [state, setState] = useState<QuizState>({
    phase: 'setup',
    sessionId: null,
    question: null,
    result: null,
    summary: null,
    loading: false,
    error: null,
    correctCount: 0,
    wrongCount: 0,
  })

  const start = useCallback(async (sourceLang: SourceLanguage, numQuestions: number) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { session_id } = await startQuiz({
        quiz_type: quizType,
        source_language: sourceLang,
        num_questions: numQuestions,
      })
      const question = await getNextQuestion(session_id)
      setState({
        phase: 'question',
        sessionId: session_id,
        question,
        result: null,
        summary: null,
        loading: false,
        error: null,
        correctCount: 0,
        wrongCount: 0,
      })
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [quizType])

  const answer = useCallback(async (text: string) => {
    if (!state.sessionId) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const result = await submitAnswer(state.sessionId, { answer: text })
      setState((s) => ({
        ...s,
        phase: 'result',
        result,
        loading: false,
        correctCount: result.correct ? s.correctCount + 1 : s.correctCount,
        wrongCount: result.correct ? s.wrongCount : s.wrongCount + 1,
      }))
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [state.sessionId])

  const next = useCallback(async () => {
    if (!state.sessionId) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const question = await getNextQuestion(state.sessionId)
      setState((s) => ({ ...s, phase: 'question', question, result: null, loading: false }))
    } catch {
      // No more questions - end the session
      const summary = await endQuiz(state.sessionId)
      setState((s) => ({ ...s, phase: 'summary', summary, loading: false }))
    }
  }, [state.sessionId])

  const reset = useCallback(() => {
    setState({
      phase: 'setup',
      sessionId: null,
      question: null,
      result: null,
      summary: null,
      loading: false,
      error: null,
      correctCount: 0,
      wrongCount: 0,
    })
  }, [])

  return { ...state, start, answer, next, reset }
}
