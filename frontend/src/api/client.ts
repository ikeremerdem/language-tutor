import type {
  Word,
  WordCreate,
  WordUpdate,
  WordLookup,
  QuizStartRequest,
  QuizQuestion,
  QuizAnswerRequest,
  QuizAnswerResult,
  QuizSummary,
  DashboardStats,
} from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Vocabulary
export const lookupWord = (english: string) =>
  request<WordLookup>(`/vocabulary/lookup?english=${encodeURIComponent(english)}`)
export const getWords = () => request<Word[]>('/vocabulary')
export const addWord = (data: WordCreate) =>
  request<Word>('/vocabulary', { method: 'POST', body: JSON.stringify(data) })
export const updateWord = (id: string, data: WordUpdate) =>
  request<Word>(`/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteWord = (id: string) =>
  request<void>(`/vocabulary/${id}`, { method: 'DELETE' })

// Quiz
export const startQuiz = (data: QuizStartRequest) =>
  request<{ session_id: string }>('/quiz/start', { method: 'POST', body: JSON.stringify(data) })
export const getNextQuestion = (sessionId: string) =>
  request<QuizQuestion>(`/quiz/${sessionId}/next`)
export const submitAnswer = (sessionId: string, data: QuizAnswerRequest) =>
  request<QuizAnswerResult>(`/quiz/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(data) })
export const endQuiz = (sessionId: string) =>
  request<QuizSummary>(`/quiz/${sessionId}/end`, { method: 'POST' })

// Stats
export const getDashboard = () => request<DashboardStats>('/stats/dashboard')
export const resetStats = () => request<void>('/stats/reset', { method: 'DELETE' })
