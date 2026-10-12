from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.research_gap import CandidateGap
from app.schemas.gap import CandidateGapResponse, GapDecisionRequest, GapGenerateRequest
from app.services.gap_engine import gap_engine

router = APIRouter(prefix="/gaps", tags=["Research Gap Engine"])

@router.post("/discover", response_model=List[CandidateGapResponse])
async def discover_research_gaps(
    req: GapGenerateRequest,
    db: Session = Depends(get_db)
):
    try:
        return await gap_engine.discover_gaps(
            db=db,
            project_id=req.project_id,
            paper_ids=req.paper_ids,
            focus_domain=req.focus_domain
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap discovery failed: {str(e)}")

@router.get("", response_model=List[CandidateGapResponse])
def list_gaps(
    project_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    evidence_strength: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CandidateGap)
    if project_id:
        query = query.filter(CandidateGap.project_id == project_id)
    if category:
        query = query.filter(CandidateGap.category == category)
    if review_status:
        query = query.filter(CandidateGap.review_status == review_status)
    if evidence_strength:
        query = query.filter(CandidateGap.evidence_strength == evidence_strength)

    gaps = query.order_by(CandidateGap.created_at.desc()).all()
    return [gap_engine.to_response_schema(g) for g in gaps]

@router.get("/{gap_id}", response_model=CandidateGapResponse)
def get_gap(gap_id: str, db: Session = Depends(get_db)):
    gap = db.query(CandidateGap).filter(CandidateGap.id == gap_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Candidate research gap not found")
    return gap_engine.to_response_schema(gap)

@router.put("/{gap_id}/review", response_model=CandidateGapResponse)
def review_gap(
    gap_id: str,
    decision: GapDecisionRequest,
    db: Session = Depends(get_db)
):
    res = gap_engine.update_gap_review(db, gap_id, decision)
    if not res:
        raise HTTPException(status_code=404, detail="Candidate research gap not found")
    return res
