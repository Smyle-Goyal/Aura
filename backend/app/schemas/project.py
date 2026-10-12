from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    research_question: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    research_question: Optional[str] = None
    is_archived: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    paper_count: int = 0
    run_count: int = 0
    report_count: int = 0
    gap_count: int = 0

    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    paper_ids: List[str] = []
