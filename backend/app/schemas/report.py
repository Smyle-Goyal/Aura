from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportCreate(BaseModel):
    project_id: str
    run_id: Optional[str] = None
    title: str = Field(..., min_length=2)
    abstract: Optional[str] = None
    content_markdown: str
    structured_sections: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, Any]]] = None

class ReportResponse(BaseModel):
    id: str
    project_id: str
    run_id: Optional[str]
    title: str
    abstract: Optional[str]
    content_markdown: str
    structured_sections: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    project_id: str
    paper_id: Optional[str] = None
    title: str = Field(..., min_length=1)
    content: str
    tags: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    project_id: str
    paper_id: Optional[str]
    title: str
    content: str
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
