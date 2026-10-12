from pydantic import BaseModel, Field
from typing import Optional, List

class CitationItem(BaseModel):
    citation_id: int
    paper_id: str
    paper_title: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    snippet: str
    similarity_score: float = 0.0

class SinglePaperQueryRequest(BaseModel):
    paper_id: str
    question: str = Field(..., min_length=2)
    top_k: int = Field(default=5, ge=1, le=20)

class MultiPaperQueryRequest(BaseModel):
    project_id: str
    paper_ids: Optional[List[str]] = None
    question: str = Field(..., min_length=2)
    top_k: int = Field(default=8, ge=1, le=30)

class RAGResponse(BaseModel):
    question: str
    answer: str
    citations: List[CitationItem] = []
    model_used: str
    retrieval_scope: str
    confidence_assessment: str
    retrieved_chunk_count: int
