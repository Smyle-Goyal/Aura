import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.paper import Paper, ProjectPaper, PaperChunk
from app.models.ingestion import IngestionJob
from app.schemas.paper import PaperResponse, PaperDetailResponse, PaperChunkResponse
from app.services.ingestion_service import ingestion_service

router = APIRouter(prefix="/papers", tags=["Paper Library"])

def _to_paper_response(p: Paper, db: Session) -> PaperResponse:
    chunk_count = db.query(PaperChunk).filter(PaperChunk.paper_id == p.id).count()
    projects = db.query(ProjectPaper).filter(ProjectPaper.paper_id == p.id).all()
    project_ids = [pr.project_id for pr in projects]

    return PaperResponse(
        id=p.id,
        title=p.title,
        authors=p.authors,
        publication_year=p.publication_year,
        abstract=p.abstract,
        doi=p.doi,
        url=p.url,
        venue=p.venue,
        tags=p.tags,
        file_name=p.file_name,
        file_size_bytes=p.file_size_bytes or 0,
        page_count=p.page_count or 0,
        ingestion_status=p.ingestion_status or "pending",
        ingestion_error=p.ingestion_error,
        created_at=p.created_at,
        updated_at=p.updated_at,
        chunk_count=chunk_count,
        project_ids=project_ids
    )

@router.get("", response_model=List[PaperResponse])
def list_papers(
    project_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Paper)

    if project_id:
        query = query.join(ProjectPaper).filter(ProjectPaper.project_id == project_id)

    if status:
        query = query.filter(Paper.ingestion_status == status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Paper.title.ilike(search_filter)) |
            (Paper.authors.ilike(search_filter)) |
            (Paper.abstract.ilike(search_filter))
        )

    papers = query.order_by(Paper.created_at.desc()).all()
    return [_to_paper_response(p, db) for p in papers]

@router.post("/upload", response_model=PaperResponse, status_code=201)
async def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),
    publication_year: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    # 1. Read file bytes and validate
    file_bytes = await file.read()
    file_size = len(file_bytes)

    valid, err_msg = ingestion_service.validate_pdf(file.filename or "", file_size, file_bytes)
    if not valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # 2. Duplicate Detection via SHA-256
    file_hash = ingestion_service.compute_sha256(file_bytes)
    existing_paper = db.query(Paper).filter(Paper.file_hash == file_hash).first()

    if existing_paper:
        # If paper already exists, associate with project if not yet associated
        if project_id:
            assoc = db.query(ProjectPaper).filter(
                ProjectPaper.project_id == project_id,
                ProjectPaper.paper_id == existing_paper.id
            ).first()
            if not assoc:
                db.add(ProjectPaper(project_id=project_id, paper_id=existing_paper.id))
                db.commit()
        return _to_paper_response(existing_paper, db)

    # 3. Save physical file to disk
    paper_id = str(uuid.uuid4())
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    clean_filename = f"{paper_id}_{file.filename}"
    file_path = upload_dir / clean_filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 4. Create Paper record
    paper_title = title or file.filename.replace(".pdf", "").replace("_", " ").title()
    new_paper = Paper(
        id=paper_id,
        title=paper_title,
        authors=authors,
        publication_year=publication_year,
        file_path=str(file_path),
        file_name=file.filename,
        file_hash=file_hash,
        file_size_bytes=file_size,
        ingestion_status="processing"
    )
    db.add(new_paper)

    if project_id:
        db.add(ProjectPaper(project_id=project_id, paper_id=paper_id))

    db.commit()
    db.refresh(new_paper)

    # 5. Launch ingestion pipeline asynchronously
    background_tasks.add_task(ingestion_service.ingest_paper, db, new_paper.id)

    return _to_paper_response(new_paper, db)

@router.get("/{paper_id}", response_model=PaperDetailResponse)
def get_paper(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    base_resp = _to_paper_response(paper, db)
    chunks = db.query(PaperChunk).filter(PaperChunk.paper_id == paper.id).order_by(PaperChunk.chunk_index).all()
    
    chunk_responses = [
        PaperChunkResponse(
            id=c.id,
            chunk_index=c.chunk_index,
            page_number=c.page_number,
            section=c.section,
            content=c.content,
            token_count=c.token_count
        ) for c in chunks
    ]

    return PaperDetailResponse(
        **base_resp.model_dump(),
        chunks=chunk_responses
    )

@router.post("/{paper_id}/assign-project")
def assign_paper_to_project(
    paper_id: str,
    project_id: str = Form(...),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    existing = db.query(ProjectPaper).filter(
        ProjectPaper.project_id == project_id,
        ProjectPaper.paper_id == paper_id
    ).first()

    if not existing:
        db.add(ProjectPaper(project_id=project_id, paper_id=paper_id))
        db.commit()

    return {"status": "success", "message": "Paper assigned to project"}

@router.delete("/{paper_id}", status_code=204)
def delete_paper(paper_id: str, db: Session = Depends(get_db)):
    success = ingestion_service.delete_paper(db, paper_id)
    if not success:
        raise HTTPException(status_code=404, detail="Paper not found")
    return None
