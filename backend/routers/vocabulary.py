from fastapi import APIRouter, Depends, HTTPException

from models.vocabulary import Word, WordCreate, WordUpdate, AddCategoriesRequest, DuplicateWordError
from middleware.auth import get_current_user
from services import vocabulary_service, tutor_service
from services.sentence_service import lookup_word, lookup_word_reverse

router = APIRouter(prefix="/api/tutors/{tutor_id}/vocabulary", tags=["vocabulary"])


def _get_tutor_or_404(tutor_id: str, user_id: str):
    tutor = tutor_service.get_tutor(tutor_id, user_id)
    if not tutor:
        raise HTTPException(404, "Tutor not found")
    return tutor


@router.get("/lookup")
def lookup(tutor_id: str, english: str, user_id: str = Depends(get_current_user)):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        return lookup_word(english, tutor.language)
    except Exception as e:
        raise HTTPException(500, f"Lookup failed: {e}")


@router.get("/lookup-reverse")
def lookup_reverse(tutor_id: str, target_word: str, user_id: str = Depends(get_current_user)):
    tutor = _get_tutor_or_404(tutor_id, user_id)
    try:
        return lookup_word_reverse(target_word, tutor.language)
    except Exception as e:
        raise HTTPException(500, f"Lookup failed: {e}")


@router.get("", response_model=list[Word])
def list_words(tutor_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    return vocabulary_service.list_words(tutor_id)


@router.post("", response_model=Word, status_code=201)
def add_word(tutor_id: str, data: WordCreate, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    try:
        return vocabulary_service.add_word(tutor_id, user_id, data)
    except DuplicateWordError as e:
        raise HTTPException(409, detail={"message": str(e), "existing_id": e.existing_id})


@router.put("/{word_id}", response_model=Word)
def update_word(tutor_id: str, word_id: str, data: WordUpdate, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    word = vocabulary_service.update_word(word_id, tutor_id, data)
    if not word:
        raise HTTPException(404, "Word not found")
    return word


@router.patch("/{word_id}/categories", response_model=Word)
def add_word_categories(tutor_id: str, word_id: str, data: AddCategoriesRequest, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    word = vocabulary_service.add_categories_to_word(word_id, tutor_id, data.categories)
    if not word:
        raise HTTPException(404, "Word not found")
    return word


@router.delete("/{word_id}", status_code=204)
def delete_word(tutor_id: str, word_id: str, user_id: str = Depends(get_current_user)):
    _get_tutor_or_404(tutor_id, user_id)
    if not vocabulary_service.delete_word(word_id, tutor_id):
        raise HTTPException(404, "Word not found")
