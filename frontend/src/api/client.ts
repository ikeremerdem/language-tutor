import { supabase } from '../lib/supabase'
import type {
  Word,
  WordCreate,
  WordUpdate,
  WordLookup,
  WordLookupReverse,
  AdminUserStats,
  QuizStartRequest,
  QuizQuestion,
  QuizAnswerRequest,
  QuizAnswerResult,
  QuizSummary,
  DashboardStats,
  RecentSession,
  QuizType,
  LanguageTutor,
  TutorPreferences,
  WordPackageSummary,
  WordPackageDetail,
  WordPackageCreate,
  WordPackageUpdate,
  Persona,
  ConversationMessage,
  StartConversationResponse,
} from '../types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api'

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
    let message = text || res.statusText
    let existingId: string | undefined
    try {
      const body = JSON.parse(text)
      if (body?.detail?.message) {
        message = body.detail.message
        existingId = body.detail.existing_id
      } else if (body?.detail) {
        message = typeof body.detail === 'string' ? body.detail : message
      }
    } catch { /* not JSON */ }
    const err = new Error(message) as Error & { existingId?: string; status?: number }
    err.status = res.status
    if (existingId) err.existingId = existingId
    throw err
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

export const getPreferences = (tutorId: string) =>
  request<TutorPreferences>(`/tutors/${tutorId}/preferences`)

export const updatePreferences = (tutorId: string, data: TutorPreferences) =>
  request<TutorPreferences>(`/tutors/${tutorId}/preferences`, { method: 'PATCH', body: JSON.stringify(data) })

// ── Vocabulary ───────────────────────────────────────────────
export const lookupWord = (tutorId: string, english: string) =>
  request<WordLookup>(`/tutors/${tutorId}/vocabulary/lookup?english=${encodeURIComponent(english)}`)

export const lookupWordReverse = (tutorId: string, targetWord: string) =>
  request<WordLookupReverse>(`/tutors/${tutorId}/vocabulary/lookup-reverse?target_word=${encodeURIComponent(targetWord)}`)

export const getWords = (tutorId: string) =>
  request<Word[]>(`/tutors/${tutorId}/vocabulary`)

export const addWord = (tutorId: string, data: WordCreate) =>
  request<Word>(`/tutors/${tutorId}/vocabulary`, { method: 'POST', body: JSON.stringify(data) })

export const updateWord = (tutorId: string, id: string, data: WordUpdate) =>
  request<Word>(`/tutors/${tutorId}/vocabulary/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteWord = (tutorId: string, id: string) =>
  request<void>(`/tutors/${tutorId}/vocabulary/${id}`, { method: 'DELETE' })

export const addWordCategories = (tutorId: string, id: string, categories: string[]) =>
  request<Word>(`/tutors/${tutorId}/vocabulary/${id}/categories`, { method: 'PATCH', body: JSON.stringify({ categories }) })

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

// ── Admin ─────────────────────────────────────────────────────
export const checkAdmin = () =>
  request<{ ok: boolean }>('/admin/check')

export const getAdminUserStats = () =>
  request<AdminUserStats[]>('/admin/users')

// ── Packages ──────────────────────────────────────────────────
export const getPackages = () =>
  request<WordPackageSummary[]>('/packages')

export const getPackage = (id: string) =>
  request<WordPackageDetail>(`/packages/${id}`)

export const generatePackageWords = (name: string, description: string, category: string) =>
  request<{ words: string[] }>('/packages/generate-words', { method: 'POST', body: JSON.stringify({ name, description, category }) })

export const createPackage = (data: WordPackageCreate) =>
  request<WordPackageDetail>('/packages', { method: 'POST', body: JSON.stringify(data) })

export const updatePackage = (id: string, data: WordPackageUpdate) =>
  request<WordPackageDetail>(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deletePackage = (id: string) =>
  request<void>(`/packages/${id}`, { method: 'DELETE' })

// ── Conversations ──────────────────────────────────────────────
export const getPersonas = () =>
  request<Persona[]>('/personas')

export const startConversation = (tutorId: string, data: { persona_id: string; context_id?: string }) =>
  request<StartConversationResponse>(`/tutors/${tutorId}/conversations`, { method: 'POST', body: JSON.stringify(data) })

export const getConversationMessages = (tutorId: string, conversationId: string) =>
  request<ConversationMessage[]>(`/tutors/${tutorId}/conversations/${conversationId}/messages`)

export const translateSentence = (tutorId: string, text: string) =>
  request<{ translation: string }>(`/tutors/${tutorId}/conversations/translate`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })

export const sendConversationMessage = (tutorId: string, conversationId: string, content: string) =>
  request<{ content: string }>(`/tutors/${tutorId}/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })

// ── Admin: Personas ────────────────────────────────────────────
export const adminGetPersonas = () =>
  request<Persona[]>('/admin/personas')

export const adminCreatePersona = (data: { name: string; description: string; persona_prompt: string; image_url: string }) =>
  request<Persona>('/admin/personas', { method: 'POST', body: JSON.stringify(data) })

export const adminUpdatePersona = (id: string, data: Partial<{ name: string; description: string; persona_prompt: string; image_url: string }>) =>
  request<Persona>(`/admin/personas/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const adminDeletePersona = (id: string) =>
  request<void>(`/admin/personas/${id}`, { method: 'DELETE' })

export const adminCreateContext = (personaId: string, label: string) =>
  request<{ id: string; label: string }>(`/admin/personas/${personaId}/contexts`, { method: 'POST', body: JSON.stringify({ label }) })

export const adminDeleteContext = (personaId: string, contextId: string) =>
  request<void>(`/admin/personas/${personaId}/contexts/${contextId}`, { method: 'DELETE' })
