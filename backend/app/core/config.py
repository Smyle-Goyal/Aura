from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AURA — Autonomous Unified Research Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./data/aura.db")

    # AI & Embeddings
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")
    GEMINI_EMBEDDING_MODEL: str = Field(default="text-embedding-004")

    # Vector Database
    QDRANT_URL: Optional[str] = Field(default=None)
    QDRANT_LOCAL_PATH: str = Field(default="./data/qdrant")
    QDRANT_COLLECTION: str = Field(default="aura_papers")

    # Document Chunking
    DEFAULT_CHUNK_SIZE: int = Field(default=1000)
    DEFAULT_CHUNK_OVERLAP: int = Field(default=200)

    # File Storage
    UPLOAD_DIR: str = Field(default="./data/uploads")
    MAX_FILE_SIZE_MB: int = Field(default=50)

    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
if settings.QDRANT_LOCAL_PATH and not settings.QDRANT_URL:
    Path(settings.QDRANT_LOCAL_PATH).mkdir(parents=True, exist_ok=True)
