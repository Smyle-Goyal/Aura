from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MethodologyItem(BaseModel):
    paper_id: str
    paper_title: str
    paradigm: str
    architecture_or_method: str
    strengths: List[str]
    weaknesses: List[str]

class DatasetMetricItem(BaseModel):
    paper_id: str
    paper_title: str
    datasets_used: List[str]
    evaluation_metrics: List[str]
    reported_results: str
    benchmark_notes: str

class FindingsLimitationsItem(BaseModel):
    paper_id: str
    paper_title: str
    key_findings: List[str]
    author_limitations: List[str]
    implied_weaknesses: List[str]

class ConsensusPoint(BaseModel):
    claim: str
    supporting_papers: List[str]
    evidence_summary: str

class ContradictionPoint(BaseModel):
    dimension: str
    perspective_a: str
    paper_a: str
    perspective_b: str
    paper_b: str
    divergence_rationale: str

class ComparisonRequest(BaseModel):
    project_id: str
    paper_ids: List[str] = Field(..., min_length=2)
    research_question: str = Field(..., min_length=5)
    title: Optional[str] = None

class ComparisonResponse(BaseModel):
    id: str
    project_id: str
    title: str
    research_question: str
    paper_ids: List[str]
    methodology_matrix: List[MethodologyItem] = []
    dataset_metric_matrix: List[DatasetMetricItem] = []
    findings_limitations_matrix: List[FindingsLimitationsItem] = []
    agreements: List[ConsensusPoint] = []
    disagreements: List[ContradictionPoint] = []
    synthesis_narrative: str
    created_at: datetime

    class Config:
        from_attributes = True
