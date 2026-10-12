from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResearchRunCreate(BaseModel):
    project_id: str
    objective: str = Field(..., min_length=10)
    paper_ids: Optional[List[str]] = None

class WorkflowStageResponse(BaseModel):
    id: str
    stage_index: int
    stage_name: str
    status: str
    summary: Optional[str] = None
    input_payload: Optional[Dict[str, Any]] = None
    output_payload: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ResearchRunResponse(BaseModel):
    id: str
    project_id: str
    objective: str
    status: str
    progress_percent: int
    current_stage_name: str
    selected_paper_ids: List[str] = []
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResearchRunDetailResponse(ResearchRunResponse):
    stages: List[WorkflowStageResponse] = []
