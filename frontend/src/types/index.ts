export type WordType = 'verb' | 'noun' | 'adjective' | 'adverb' | 'preposition' | 'other'

export interface Word {
  id: string
  word_type: WordType
  english: string
  target_language: string
  notes: string
  created_at: string
  times_asked: number
  times_correct: number
  last_asked: string | null
  current_streak: number
  categories: string[]
}

export interface WordCreate {
  word_type: WordType
  english: string
  target_language: string
  notes: string
  categories: string[]
}

export interface WordLookup {
  target_language: string
  word_type: WordType
  notes: string
}

export interface WordLookupReverse {
  english: string
  word_type: WordType
  notes: string
}

export interface WordUpdate {
  word_type?: WordType
  english?: string
  target_language?: string
  notes?: string
  categories?: string[]
}

export type QuizType = 'word' | 'sentence'
export type SourceLanguage = 'english' | 'target_language'
export type QuizFocus = 'balanced' | 'new_words' | 'struggling'

export interface QuizStartRequest {
  quiz_type: QuizType
  source_language: SourceLanguage
  num_questions: number
  focus: QuizFocus
}

export interface QuizQuestion {
  question_number: number
  total_questions: number
  prompt: string
  source_language: SourceLanguage
  quiz_type: QuizType
  word_id?: string
}

export interface QuizAnswerRequest {
  answer: string
}

export interface QuizAnswerResult {
  correct: boolean
  correct_answer: string
  your_answer: string
  notes?: string
  explanation?: string
}

export interface QuizSummary {
  session_id: string
  quiz_type: QuizType
  total_questions: number
  correct_answers: number
  score_percent: number
  details: QuizDetailItem[]
}

export interface QuizDetailItem {
  prompt: string
  your_answer: string
  correct_answer: string
  correct: boolean
}

export interface DifficultWord {
  id: string
  english: string
  target_language: string
  times_asked: number
  times_correct: number
  success_percent: number
}

export interface WordStatusCounts {
  new: number
  struggling: number
  learning: number
  learned: number
}

export interface DashboardStats {
  total_words: number
  total_sessions: number
  total_questions: number
  average_score: number
  best_score: number
  word_status: WordStatusCounts
  word_type_counts: Record<string, number>
  recent_sessions: RecentSession[]
  weekly_activity: WeeklyActivity[]
  difficult_words: DifficultWord[]
}

export interface RecentSession {
  id: string
  quiz_type: QuizType
  score_percent: number
  total_questions: number
  correct_answers: number
  ended_at: string
}

export interface WeeklyActivity {
  date: string
  sessions: number
  questions: number
  avg_score: number
}

export interface WordPackageSummary {
  slug: string
  name: string
  description: string
  word_count: number
  category: string
}

export interface WordPackageDetail {
  slug: string
  name: string
  description: string
  words: string[]
  category: string
}

export interface AdminUserStats {
  user_id: string
  email: string
  created_at: string
  language_count: number
  word_count: number
  session_count: number
}

export interface LanguageTutor {
  id: string
  user_id: string
  language: string
  created_at: string
}
