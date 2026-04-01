from pydantic import BaseModel


class LanguageTutor(BaseModel):
    id: str
    user_id: str
    language: str
    created_at: str


class TutorCreate(BaseModel):
    language: str
