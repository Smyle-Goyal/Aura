from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.paper import Paper
from app.models.ingestion import IngestionJob
from app.schemas.ingestion import IngestionJobResponse, IngestionRetryRequest
from app.services.ingestion_service import ingestion_service

router = APIRouter(prefix="/ingestion", tags=["Document Ingestion"])

@router.get("/status/{paper_id}", response_model=IngestionJobResponse)
def get_ingestion_status(paper_id: str, db: Session = Depends(get_db)):
    job = db.query(IngestionJob).filter(IngestionJob.paper_id == paper_id).order_by(IngestionJob.created_at.desc()).first()
    if not job:
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        # Return synthetic status if job record wasn't created yet
        return IngestionJobResponse(
            id="initial",
            paper_id=paper.id,
            status=paper.ingestion_status or "pending",
            current_stage="Processing queue",
            total_pages=paper.page_count or 0,
            total_chunks=0,
            error_message=paper.ingestion_error,
            retry_count=0,
            started_at=paper.created_at,
            completed_at=None,
            created_at=paper.created_at
        )

    return IngestionJobResponse.model_validate(job)

@router.post("/retry", response_model=IngestionJobResponse)
async def retry_ingestion(
    retry_in: IngestionRetryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == retry_in.paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    job = db.query(IngestionJob).filter(IngestionJob.paper_id == paper.id).order_by(IngestionJob.created_at.desc()).first()
    if job:
        job.retry_count = (job.retry_count or 0) + 1
        job.status = "pending"
        job.current_stage = "Queued for retry"
        job.error_message = None
        db.commit()
        db.refresh(job)
    else:
        job = IngestionJob(
            paper_id=paper.id,
            status="pending",
            current_stage="Queued for retry",
            retry_count=1
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    paper.ingestion_status = "processing"
    paper.ingestion_error = None
    db.commit()

    background_tasks.add_task(ingestion_service.ingest_paper, db, paper.id, job.id)

    return IngestionJobResponse.model_validate(job)
