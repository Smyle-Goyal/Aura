import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.comparison import PaperComparison
from app.schemas.comparison import (
    ComparisonRequest,
    ComparisonResponse,
    MethodologyItem,
    DatasetMetricItem,
    FindingsLimitationsItem,
    ConsensusPoint,
    ContradictionPoint
)
from app.services.comparison_service import comparison_service

router = APIRouter(prefix="/comparisons", tags=["Multi-Paper Intelligence"])

def _to_comparison_response(c: PaperComparison) -> ComparisonResponse:
    paper_ids = json.loads(c.paper_ids) if c.paper_ids else []
    method_data = json.loads(c.methodology_matrix) if c.methodology_matrix else []
    dataset_data = json.loads(c.dataset_metric_matrix) if c.dataset_metric_matrix else []
    finding_data = json.loads(c.findings_limitations_matrix) if c.findings_limitations_matrix else []
    agreements_data = json.loads(c.agreements) if c.agreements else []
    disagreements_data = json.loads(c.disagreements) if c.disagreements else []

    return ComparisonResponse(
        id=c.id,
        project_id=c.project_id,
        title=c.title,
        research_question=c.research_question,
        paper_ids=paper_ids,
        methodology_matrix=[MethodologyItem(**m) for m in method_data],
        dataset_metric_matrix=[DatasetMetricItem(**d) for d in dataset_data],
        findings_limitations_matrix=[FindingsLimitationsItem(**f) for f in finding_data],
        agreements=[ConsensusPoint(**a) for a in agreements_data],
        disagreements=[ContradictionPoint(**d) for d in disagreements_data],
        synthesis_narrative=c.synthesis_narrative or "",
        created_at=c.created_at
    )

@router.post("", response_model=ComparisonResponse, status_code=201)
async def create_comparison(
    comp_in: ComparisonRequest,
    db: Session = Depends(get_db)
):
    try:
        return await comparison_service.compare_papers(
            db=db,
            project_id=comp_in.project_id,
            paper_ids=comp_in.paper_ids,
            research_question=comp_in.research_question,
            title=comp_in.title
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("", response_model=List[ComparisonResponse])
def list_comparisons(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(PaperComparison)
    if project_id:
        query = query.filter(PaperComparison.project_id == project_id)
    comparisons = query.order_by(PaperComparison.created_at.desc()).all()
    return [_to_comparison_response(c) for c in comparisons]

@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(comparison_id: str, db: Session = Depends(get_db)):
    comp = db.query(PaperComparison).filter(PaperComparison.id == comparison_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Comparison record not found")
    return _to_comparison_response(comp)
