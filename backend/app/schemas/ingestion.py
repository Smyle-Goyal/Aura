from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IngestionJobResponse(BaseModel):
    id: str
    paper_id: str
    status: str
    current_stage: str
    total_pages: int
    total_chunks: int
    error_message: Optional[str]
    retry_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class IngestionRetryRequest(BaseModel):
    paper_id: str
