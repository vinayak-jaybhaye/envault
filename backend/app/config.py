from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GH_TOKEN: str
    GH_REPO: str
    PASSWORD: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
