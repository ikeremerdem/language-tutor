from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import vocabulary, quiz, stats

app = FastAPI(title="Language Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.data_dir.mkdir(exist_ok=True)

app.include_router(vocabulary.router)
app.include_router(quiz.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def config():
    return {"target_language": settings.target_language}
