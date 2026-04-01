from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings, SUPPORTED_LANGUAGES
from routers import vocabulary, quiz, stats, tutors

app = FastAPI(title="Filos Language Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.data_dir.mkdir(exist_ok=True)

app.include_router(tutors.router)
app.include_router(vocabulary.router)
app.include_router(quiz.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/languages")
def supported_languages():
    return {"languages": SUPPORTED_LANGUAGES}
