"""
Central word-scoring module.

word_category(word) -> str
  Classifies a word into one of four mutually exclusive status categories:
    "new"        — never asked
    "struggling" — asked at least once, streak is 0
    "learning"   — streak > 0 but below the learn threshold
    "learned"    — streak >= STREAK_LEARN_THRESHOLD

word_weight(word, focus) -> float
  Returns the sampling weight for a word under a given quiz focus.
  A weight of EXCLUDE (0.0) means the word must not be selected for that focus.

attention_weight(word) -> float
  Focus-independent weight used for vocabulary list ordering.
"""

from enum import Enum

from config import STREAK_LEARN_THRESHOLD
from models.vocabulary import Word
from models.quiz import QuizFocus

EXCLUDE = 0.0


class WordCategory(str, Enum):
    new = "new"
    struggling = "struggling"
    learning = "learning"
    learned = "learned"


def word_category(word: Word) -> WordCategory:
    if word.current_streak >= STREAK_LEARN_THRESHOLD:
        return WordCategory.learned
    if word.times_asked == 0:
        return WordCategory.new
    if word.current_streak == 0:
        return WordCategory.struggling
    return WordCategory.learning


def is_learned(word: Word) -> bool:
    return word_category(word) == WordCategory.learned


def _base_weight(word: Word) -> float:
    """Attention weight for an active (non-learned) word."""
    if word.times_asked == 0:
        return 10.0
    accuracy = word.times_correct / word.times_asked
    return max(1.0, 5.0 * (1 - accuracy) + 2.0 / (1 + word.times_asked))


def word_weight(word: Word, focus: QuizFocus) -> float:
    """
    Sampling weight for quiz selection.
    Returns EXCLUDE (0.0) when the word should not appear under this focus.
    """
    if focus == QuizFocus.new_words:
        return 1.0 if word.times_asked == 0 else EXCLUDE

    if focus == QuizFocus.struggling:
        # Struggling: asked at least once and streak is 0 (matches WordCategory.struggling)
        if word.times_asked == 0 or word.current_streak != 0:
            return EXCLUDE
        return _base_weight(word)

    # balanced — exclude learned words; caller handles the all-learned fallback
    if is_learned(word):
        return EXCLUDE
    return _base_weight(word)


def attention_weight(word: Word) -> float:
    """
    Focus-independent weight used for vocabulary list ordering.
    Learned words are deprioritised to the bottom of the list.
    """
    if is_learned(word):
        return 0.1
    return _base_weight(word)
