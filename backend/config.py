from pydantic_settings import BaseSettings
from pathlib import Path

SUPPORTED_LANGUAGES = ["Greek", "German", "Spanish", "Italian", "French"]

# Words with a correct-answer streak >= this value are considered "learned"
# and are deprioritised in quiz selection.
STREAK_LEARN_THRESHOLD = 5


class Settings(BaseSettings):
    # LLM
    llm_model: str = "openai/gpt-5.4-mini"
    llm_api_key: str = ""
    llm_api_base: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # CORS — comma-separated origins e.g. "https://app.vercel.app,http://localhost:5173"
    allowed_origins_str: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins_str.split(",")]

    # Local data directory (sentence structures per language)
    data_dir: Path = Path(__file__).parent / "data"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
