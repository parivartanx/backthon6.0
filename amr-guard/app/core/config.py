from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./amrguard.db"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    APP_ENV: str = "dev"

    class Config:
        env_file = ".env"

settings = Settings()
