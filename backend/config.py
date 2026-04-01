from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    llm_model: str = "openai/gpt-4o-mini"  # litellm model string
    llm_api_key: str = ""  # set matching env var (OPENAI_API_KEY, etc.) or this
    llm_api_base: str = ""  # override for local endpoints (ollama, lmstudio)

    target_language: str = "Greek"  # the language being learned (e.g. Greek, Spanish, French)

    data_dir: Path = Path(__file__).parent / "data"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
