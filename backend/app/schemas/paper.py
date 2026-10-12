from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PaperBase(BaseModel):
    title: str
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    venue: Optional[str] = None
    tags: Optional[str] = None

class PaperCreate(PaperBase):
    project_id: Optional[str] = None

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    venue: Optional[str] = None
    tags: Optional[str] = None

class PaperChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int]
    section: Optional[str]
    content: str
    token_count: int

    class Config:
        from_attributes = True

class PaperResponse(PaperBase):
    id: str
    file_name: Optional[str]
    file_size_bytes: int
    page_count: int
    ingestion_status: str
    ingestion_error: Optional[str]
    created_at: datetime
    updated_at: datetime
    chunk_count: int = 0
    project_ids: List[str] = []

    class Config:
        from_attributes = True

class PaperDetailResponse(PaperResponse):
    chunks: List[PaperChunkResponse] = []
