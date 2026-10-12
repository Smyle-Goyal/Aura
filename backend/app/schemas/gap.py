from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SupportingPaperRef(BaseModel):
    paper_id: str
    paper_title: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    quoted_passage: str

class CandidateGapResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    category: str
    supporting_papers: List[Dict[str, Any]] = []
    author_stated_limitations: List[str] = []
    conflicting_findings: List[str] = []
    significance_rationale: Optional[str] = None
    candidate_research_questions: List[str] = []
    testable_hypotheses: List[str] = []
    suggested_experiments: List[str] = []
    potential_metrics: List[str] = []
    evidence_strength: str  # strong, moderate, preliminary, insufficient
    evidence_justification: Optional[str] = None
    missing_evidence_notes: Optional[str] = None
    uncertainty_rating: str  # low, medium, high
    review_status: str  # unreviewed, promising, rejected, investigating
    user_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GapDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(unreviewed|promising|rejected|investigating)$")
    reviewer_note: Optional[str] = None

class GapGenerateRequest(BaseModel):
    project_id: str
    paper_ids: Optional[List[str]] = None
    focus_domain: Optional[str] = None
