from pydantic import BaseModel
from typing import Dict, Any, Optional

class ServiceHealthStatus(BaseModel):
    database: str
    qdrant: str
    gemini_api: str
    file_storage: str
    active_models: Dict[str, str]

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    services: ServiceHealthStatus
    details: Optional[Dict[str, Any]] = None
