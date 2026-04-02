from pydantic import BaseModel


class RecentSession(BaseModel):
    id: str
    quiz_type: str
    score_percent: float
    total_questions: int
    correct_answers: int
    ended_at: str


class WeeklyActivity(BaseModel):
    date: str
    sessions: int
    questions: int
    avg_score: float


class DifficultWord(BaseModel):
    id: str
    english: str
    target_language: str
    times_asked: int
    times_correct: int
    success_percent: float


class WordStatusCounts(BaseModel):
    new: int
    struggling: int
    learning: int
    learned: int


class DashboardStats(BaseModel):
    total_words: int
    total_sessions: int
    total_questions: int
    average_score: float
    best_score: float
    word_status: WordStatusCounts
    word_type_counts: dict[str, int]
    recent_sessions: list[RecentSession]
    weekly_activity: list[WeeklyActivity]
    difficult_words: list[DifficultWord]
