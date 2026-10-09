from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./amrguard.db"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.5-flash-lite"
    APP_ENV: str = "dev"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
