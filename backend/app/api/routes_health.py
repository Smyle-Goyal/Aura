import os
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthResponse, ServiceHealthStatus
from app.services.qdrant_service import qdrant_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", response_model=HealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    # 1. Database check
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Qdrant check
    qdrant_info = qdrant_service.check_health()
    qdrant_status = qdrant_info.get("status", "unknown")
    if qdrant_info.get("mode"):
        qdrant_status += f" ({qdrant_info['mode']})"

    # 3. Gemini status (safe reporting without exposing keys)
    gemini_status = "configured" if gemini_service.is_configured else "unconfigured (offline-grounded-fallback active)"

    # 4. Storage check
    upload_dir = Path(settings.UPLOAD_DIR)
    storage_status = "available" if upload_dir.exists() and os.access(upload_dir, os.W_OK) else "read-only or missing"

    overall_status = "healthy"
    if "unhealthy" in db_status:
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment="development" if "sqlite" in settings.DATABASE_URL else "production",
        services=ServiceHealthStatus(
            database=db_status,
            qdrant=qdrant_status,
            gemini_api=gemini_status,
            file_storage=storage_status,
            active_models={
                "chat_completion": settings.GEMINI_MODEL,
                "embedding": settings.GEMINI_EMBEDDING_MODEL
            }
        ),
        details={
            "database_type": "SQLite (local development)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL",
            "qdrant_collection": settings.QDRANT_COLLECTION,
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "default_chunk_size": settings.DEFAULT_CHUNK_SIZE,
            "default_chunk_overlap": settings.DEFAULT_CHUNK_OVERLAP
        }
    )
