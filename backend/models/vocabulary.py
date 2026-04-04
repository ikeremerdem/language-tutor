from pydantic import BaseModel
from enum import Enum
from typing import Optional


class WordType(str, Enum):
    verb = "verb"
    noun = "noun"
    adjective = "adjective"
    adverb = "adverb"
    preposition = "preposition"
    other = "other"


class DuplicateWordError(ValueError):
    def __init__(self, message: str, existing_id: str):
        super().__init__(message)
        self.existing_id = existing_id


class WordCreate(BaseModel):
    word_type: WordType
    english: str
    target_language: str
    notes: str = ""
    categories: list[str] = []


class WordUpdate(BaseModel):
    word_type: Optional[WordType] = None
    english: Optional[str] = None
    target_language: Optional[str] = None
    notes: Optional[str] = None
    categories: Optional[list[str]] = None


class AddCategoriesRequest(BaseModel):
    categories: list[str]


class Word(BaseModel):
    id: str
    word_type: WordType
    english: str
    target_language: str
    notes: str
    created_at: str
    times_asked: int = 0
    times_correct: int = 0
    last_asked: Optional[str] = None
    current_streak: int = 0
    categories: list[str] = []
