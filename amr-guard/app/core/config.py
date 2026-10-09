from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./amrguard.db"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.5-flash-lite"
    OPENAI_API_KEY: str = ""
    APP_ENV: str = "dev"

    class Config:
        env_file = ".env"

settings = Settings()
