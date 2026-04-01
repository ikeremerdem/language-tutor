import { supabase } from '../lib/supabase'
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
  RecentSession,
  QuizType,
  LanguageTutor,
} from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Tutors ──────────────────────────────────────────────────
export const getTutors = () =>
  request<LanguageTutor[]>('/tutors')

export const createTutor = (language: string) =>
  request<LanguageTutor>('/tutors', { method: 'POST', body: JSON.stringify({ language }) })

export const deleteTutor = (tutorId: string) =>
  request<void>(`/tutors/${tutorId}`, { method: 'DELETE' })

// ── Vocabulary ───────────────────────────────────────────────
export const lookupWord = (tutorId: string, english: string) =>
  request<WordLookup>(`/tutors/${tutorId}/vocabulary/lookup?english=${encodeURIComponent(english)}`)

export const getWords = (tutorId: string) =>
  request<Word[]>(`/tutors/${tutorId}/vocabulary`)

export const addWord = (tutorId: string, data: WordCreate) =>
  request<Word>(`/tutors/${tutorId}/vocabulary`, { method: 'POST', body: JSON.stringify(data) })

export const updateWord = (tutorId: string, id: string, data: WordUpdate) =>
  request<Word>(`/tutors/${tutorId}/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteWord = (tutorId: string, id: string) =>
  request<void>(`/tutors/${tutorId}/vocabulary/${id}`, { method: 'DELETE' })

// ── Quiz ─────────────────────────────────────────────────────
export const startQuiz = (tutorId: string, data: QuizStartRequest) =>
  request<{ session_id: string }>(`/tutors/${tutorId}/quiz/start`, { method: 'POST', body: JSON.stringify(data) })

export const getNextQuestion = (tutorId: string, sessionId: string) =>
  request<QuizQuestion>(`/tutors/${tutorId}/quiz/${sessionId}/next`)

export const submitAnswer = (tutorId: string, sessionId: string, data: QuizAnswerRequest) =>
  request<QuizAnswerResult>(`/tutors/${tutorId}/quiz/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(data) })

export const endQuiz = (tutorId: string, sessionId: string) =>
  request<QuizSummary>(`/tutors/${tutorId}/quiz/${sessionId}/end`, { method: 'POST' })

// ── Stats ────────────────────────────────────────────────────
export const getDashboard = (tutorId: string) =>
  request<DashboardStats>(`/tutors/${tutorId}/stats/dashboard`)

export const getSessionsByType = (tutorId: string, quizType: QuizType) =>
  request<RecentSession[]>(`/tutors/${tutorId}/stats/sessions/${quizType}`)

export const resetStats = (tutorId: string) =>
  request<void>(`/tutors/${tutorId}/stats/reset`, { method: 'DELETE' })
