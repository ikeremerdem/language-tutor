import uuid
import random
import json
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional

from models.quiz import (
    QuizType, SourceLanguage, QuizStartRequest, QuizQuestion,
    QuizAnswerResult, QuizDetailItem, QuizSummary,
)
from models.vocabulary import Word
from services import vocabulary_service
from services.supabase_client import supabase

SESSION_COLUMNS = [
    "id", "tutor_id", "user_id", "quiz_type", "source_language",
    "total_questions", "correct_answers", "score_percent",
    "started_at", "ended_at", "details_json",
]


@dataclass
class SentenceQuestion:
    sentence: str
    translation: str
    word_id: str


@dataclass
class QuizSession:
    id: str
    tutor_id: str
    user_id: str
    language: str
    quiz_type: QuizType
    source_language: SourceLanguage
    questions: list[Word]
    total_questions: int
    current_index: int = 0
    details: list[QuizDetailItem] = field(default_factory=list)
    correct_count: int = 0
    started_at: str = ""
    awaiting_answer: bool = False
    current_sentence: Optional[SentenceQuestion] = None
    used_sentences: list[str] = field(default_factory=list)


_active_sessions: dict[str, QuizSession] = {}


def start_session(tutor_id: str, user_id: str, language: str, req: QuizStartRequest) -> str:
    words = vocabulary_service.list_words(tutor_id)
    if not words:
        raise ValueError("No vocabulary words available")

    if req.quiz_type == QuizType.sentence:
        total_q = max(1, req.num_questions)
        selected: list[Word] = []
    else:
        num_q = min(req.num_questions, len(words))
        selected = _weighted_sample(words, num_q)
        total_q = len(selected)

    session_id = uuid.uuid4().hex[:8]
    session = QuizSession(
        id=session_id,
        tutor_id=tutor_id,
        user_id=user_id,
        language=language,
        quiz_type=req.quiz_type,
        source_language=req.source_language,
        questions=selected,
        total_questions=total_q,
        started_at=datetime.now(timezone.utc).isoformat(),
    )
    _active_sessions[session_id] = session
    return session_id


def get_next_question(session_id: str, user_id: str) -> QuizQuestion:
    session = _get_session(session_id, user_id)
    if session.current_index >= session.total_questions:
        raise ValueError("No more questions")
    if session.quiz_type == QuizType.sentence:
        return _get_sentence_question(session)
    return _get_word_question(session)


def _get_word_question(session: QuizSession) -> QuizQuestion:
    word = session.questions[session.current_index]
    prompt = word.english if session.source_language == SourceLanguage.english else word.target_language
    session.awaiting_answer = True
    return QuizQuestion(
        question_number=session.current_index + 1,
        total_questions=session.total_questions,
        prompt=prompt,
        source_language=session.source_language,
        quiz_type=session.quiz_type,
        word_id=word.id,
    )


def _get_sentence_question(session: QuizSession) -> QuizQuestion:
    from services.sentence_service import generate_sentence

    all_words = vocabulary_service.list_words(session.tutor_id)
    result = generate_sentence(
        all_words,
        session.source_language.value,
        session.language,
        previous_sentences=session.used_sentences,
    )
    session.used_sentences.append(result["sentence"])
    session.current_sentence = SentenceQuestion(
        sentence=result["sentence"],
        translation=result["translation"],
        word_id=result.get("word_id", ""),
    )
    session.awaiting_answer = True
    return QuizQuestion(
        question_number=session.current_index + 1,
        total_questions=session.total_questions,
        prompt=result["sentence"],
        source_language=session.source_language,
        quiz_type=session.quiz_type,
        word_id=result.get("word_id"),
    )


def submit_answer(session_id: str, user_id: str, answer: str) -> QuizAnswerResult:
    session = _get_session(session_id, user_id)
    if not session.awaiting_answer:
        raise ValueError("No question awaiting answer")
    if session.quiz_type == QuizType.sentence:
        return _submit_sentence_answer(session, answer)
    return _submit_word_answer(session, answer)


def _submit_word_answer(session: QuizSession, answer: str) -> QuizAnswerResult:
    word = session.questions[session.current_index]
    if session.source_language == SourceLanguage.english:
        correct_answer = word.target_language
        prompt = word.english
    else:
        correct_answer = word.english
        prompt = word.target_language

    is_correct = answer.strip().lower() == correct_answer.strip().lower()
    vocabulary_service.record_answer(word.id, is_correct)
    if is_correct:
        session.correct_count += 1

    session.details.append(QuizDetailItem(
        prompt=prompt, your_answer=answer,
        correct_answer=correct_answer, correct=is_correct,
    ))
    session.current_index += 1
    session.awaiting_answer = False

    return QuizAnswerResult(
        correct=is_correct, correct_answer=correct_answer,
        your_answer=answer, notes=word.notes or None,
    )


def _submit_sentence_answer(session: QuizSession, answer: str) -> QuizAnswerResult:
    from services.sentence_service import check_sentence_answer

    sq = session.current_sentence
    if not sq:
        raise ValueError("No sentence question active")

    target_lang_name = session.language if session.source_language == SourceLanguage.english else "English"
    result = check_sentence_answer(sq.sentence, sq.translation, answer, target_lang_name)

    is_correct = result["correct"]
    if is_correct:
        session.correct_count += 1

    session.details.append(QuizDetailItem(
        prompt=sq.sentence, your_answer=answer,
        correct_answer=sq.translation, correct=is_correct,
    ))
    session.current_index += 1
    session.awaiting_answer = False
    session.current_sentence = None

    return QuizAnswerResult(
        correct=is_correct, correct_answer=sq.translation,
        your_answer=answer, explanation=result.get("explanation"),
    )


def end_session(session_id: str, user_id: str) -> QuizSummary:
    session = _get_session(session_id, user_id)
    total = len(session.details) or 1
    score = round(session.correct_count / total * 100, 1)

    summary = QuizSummary(
        session_id=session.id,
        quiz_type=session.quiz_type,
        total_questions=total,
        correct_answers=session.correct_count,
        score_percent=score,
        details=session.details,
    )

    supabase.table("quiz_sessions").insert({
        "tutor_id": session.tutor_id,
        "user_id": session.user_id,
        "quiz_type": session.quiz_type.value,
        "source_language": session.source_language.value,
        "total_questions": total,
        "correct_answers": session.correct_count,
        "score_percent": score,
        "started_at": session.started_at,
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "details_json": [d.model_dump() for d in session.details],
    }).execute()

    del _active_sessions[session_id]
    return summary


def _get_session(session_id: str, user_id: str) -> QuizSession:
    session = _active_sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")
    if session.user_id != user_id:
        raise ValueError("Session not found")
    return session


def _weighted_sample(words: list[Word], k: int) -> list[Word]:
    remaining = list(words)
    selected: list[Word] = []
    for _ in range(k):
        weights = []
        for w in remaining:
            asked = w.times_asked
            if asked == 0:
                weights.append(10.0)
            else:
                accuracy = w.times_correct / asked
                weights.append(max(1.0, 5.0 * (1 - accuracy) + 2.0 / (1 + asked)))
        chosen = random.choices(remaining, weights=weights, k=1)[0]
        selected.append(chosen)
        remaining.remove(chosen)
    return selected
