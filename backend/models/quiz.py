from pydantic import BaseModel
from enum import Enum
from typing import Optional


class QuizType(str, Enum):
    word = "word"
    sentence = "sentence"


class SourceLanguage(str, Enum):
    english = "english"
    target_language = "target_language"


class QuizFocus(str, Enum):
    balanced = "balanced"
    new_words = "new_words"
    struggling = "struggling"


class QuizStartRequest(BaseModel):
    quiz_type: QuizType
    source_language: SourceLanguage
    num_questions: int = 10
    focus: QuizFocus = QuizFocus.balanced


class QuizQuestion(BaseModel):
    question_number: int
    total_questions: int
    prompt: str
    source_language: SourceLanguage
    quiz_type: QuizType
    word_id: Optional[str] = None


class QuizAnswerRequest(BaseModel):
    answer: str


class QuizAnswerResult(BaseModel):
    correct: bool
    correct_answer: str
    your_answer: str
    notes: Optional[str] = None
    explanation: Optional[str] = None


class QuizDetailItem(BaseModel):
    prompt: str
    your_answer: str
    correct_answer: str
    correct: bool


class QuizSummary(BaseModel):
    session_id: str
    quiz_type: QuizType
    total_questions: int
    correct_answers: int
    score_percent: float
    details: list[QuizDetailItem]
