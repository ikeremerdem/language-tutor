export type WordType = 'verb' | 'noun' | 'adjective' | 'adverb' | 'preposition' | 'other'

export interface Word {
  id: string
  word_type: WordType
  english: string
  greek: string
  notes: string
  created_at: string
}

export interface WordCreate {
  word_type: WordType
  english: string
  greek: string
  notes: string
}

export interface WordLookup {
  greek: string
  word_type: WordType
  notes: string
}

export interface WordUpdate {
  word_type?: WordType
  english?: string
  greek?: string
  notes?: string
}

export type QuizType = 'word' | 'sentence'
export type SourceLanguage = 'english' | 'greek'

export interface QuizStartRequest {
  quiz_type: QuizType
  source_language: SourceLanguage
  num_questions: number
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

export interface DashboardStats {
  total_words: number
  total_sessions: number
  total_questions: number
  average_score: number
  best_score: number
  recent_sessions: RecentSession[]
  weekly_activity: WeeklyActivity[]
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
