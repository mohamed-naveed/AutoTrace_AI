from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AutoTrace AI"
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "autotrace_db"
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
