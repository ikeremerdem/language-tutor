from collections import defaultdict
from datetime import datetime, timedelta, timezone

from models.stats import DashboardStats, DifficultWord, RecentSession, WeeklyActivity, WordStatusCounts
from services import vocabulary_service
from services.supabase_client import supabase


def reset_stats(tutor_id: str) -> None:
    supabase.table("quiz_sessions").delete().eq("tutor_id", tutor_id).execute()


def get_dashboard(tutor_id: str) -> DashboardStats:
    words = vocabulary_service.list_words(tutor_id)

    response = (
        supabase.table("quiz_sessions")
        .select("*")
        .eq("tutor_id", tutor_id)
        .execute()
    )
    sessions = response.data

    total_sessions = len(sessions)
    total_questions = sum(int(s.get("total_questions", 0)) for s in sessions)
    scores = [float(s["score_percent"]) for s in sessions]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0
    best_score = max(scores) if scores else 0

    recent = sorted(sessions, key=lambda s: s.get("ended_at") or "", reverse=True)[:10]
    recent_sessions = [
        RecentSession(
            id=s["id"],
            quiz_type=s["quiz_type"],
            score_percent=float(s["score_percent"]),
            total_questions=int(s["total_questions"]),
            correct_answers=int(s["correct_answers"]),
            ended_at=s.get("ended_at") or "",
        )
        for s in recent
    ]

    return DashboardStats(
        total_words=len(words),
        total_sessions=total_sessions,
        total_questions=total_questions,
        average_score=average_score,
        best_score=best_score,
        word_status=_compute_word_status(words),
        recent_sessions=recent_sessions,
        weekly_activity=_compute_weekly_activity(sessions),
        difficult_words=_compute_difficult_words(words),
    )


def get_sessions_by_type(tutor_id: str, quiz_type: str) -> list[RecentSession]:
    response = (
        supabase.table("quiz_sessions")
        .select("*")
        .eq("tutor_id", tutor_id)
        .eq("quiz_type", quiz_type)
        .order("ended_at", desc=True)
        .limit(10)
        .execute()
    )
    return [
        RecentSession(
            id=s["id"],
            quiz_type=s["quiz_type"],
            score_percent=float(s["score_percent"]),
            total_questions=int(s["total_questions"]),
            correct_answers=int(s["correct_answers"]),
            ended_at=s.get("ended_at") or "",
        )
        for s in response.data
    ]


def _compute_word_status(words) -> WordStatusCounts:
    new = sum(1 for w in words if w.times_asked == 0)
    good = sum(1 for w in words if w.times_asked > 0 and w.times_correct / w.times_asked >= 0.8)
    struggling = sum(1 for w in words if w.times_asked > 0 and w.times_correct / w.times_asked < 0.8)
    return WordStatusCounts(new=new, good=good, struggling=struggling)


def _compute_difficult_words(words) -> list[DifficultWord]:
    asked_words = [w for w in words if w.times_asked > 0]
    sorted_words = sorted(asked_words, key=lambda w: w.times_correct / w.times_asked)
    return [
        DifficultWord(
            id=w.id,
            english=w.english,
            target_language=w.target_language,
            times_asked=w.times_asked,
            times_correct=w.times_correct,
            success_percent=round(w.times_correct / w.times_asked * 100, 1),
        )
        for w in sorted_words[:10]
    ]


def _compute_weekly_activity(sessions: list[dict]) -> list[WeeklyActivity]:
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=6)

    by_date: dict[str, list[dict]] = defaultdict(list)
    for s in sessions:
        ended = s.get("ended_at") or ""
        if not ended:
            continue
        try:
            d = datetime.fromisoformat(ended).date()
        except ValueError:
            continue
        if start_date <= d <= today:
            by_date[d.isoformat()].append(s)

    result = []
    for i in range(7):
        d = (start_date + timedelta(days=i)).isoformat()
        day_sessions = by_date.get(d, [])
        scores = [float(s["score_percent"]) for s in day_sessions]
        questions = sum(int(s.get("total_questions", 0)) for s in day_sessions)
        result.append(WeeklyActivity(
            date=d,
            sessions=len(day_sessions),
            questions=questions,
            avg_score=round(sum(scores) / len(scores), 1) if scores else 0,
        ))
    return result
