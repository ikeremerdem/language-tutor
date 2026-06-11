from pydantic import BaseModel


class ReadingTextCreate(BaseModel):
    title: str = ""
    text: str
    source: str = "target"  # "english" or "target"


class ReadingTextSummary(BaseModel):
    id: str
    title: str
    created_at: str


class ReadingText(BaseModel):
    id: str
    title: str
    target_text: str
    english_text: str
    source: str
    created_at: str
