from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.paper import Paper, ProjectPaper
from app.schemas.discovery import DiscoveryResponse
from app.schemas.paper import PaperResponse
from app.services.discovery_service import discovery_service

router = APIRouter(prefix="/discovery", tags=["Literature Discovery"])

@router.get("/search", response_model=DiscoveryResponse)
async def search_scholarly_literature(
    query: str = Query(..., min_length=2),
    provider: str = Query("openalex"),
    limit: int = Query(10, ge=1, le=50),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None)
):
    try:
        return await discovery_service.search_papers(
            query=query,
            provider=provider,
            limit=limit,
            year_start=year_start,
            year_end=year_end
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scholarly search failed: {str(e)}")

@router.post("/import")
async def import_discovered_paper(
    source_id: str = Body(...),
    title: str = Body(...),
    authors: Optional[str] = Body(None),
    publication_year: Optional[int] = Body(None),
    abstract: Optional[str] = Body(None),
    doi: Optional[str] = Body(None),
    url: Optional[str] = Body(None),
    project_id: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    # Check if paper with this DOI or title already exists
    existing = None
    if doi:
        existing = db.query(Paper).filter(Paper.doi == doi).first()
    if not existing:
        existing = db.query(Paper).filter(Paper.title.ilike(title.strip())).first()

    if existing:
        if project_id:
            assoc = db.query(ProjectPaper).filter(
                ProjectPaper.project_id == project_id,
                ProjectPaper.paper_id == existing.id
            ).first()
            if not assoc:
                db.add(ProjectPaper(project_id=project_id, paper_id=existing.id))
                db.commit()
        return {"status": "exists", "paper_id": existing.id, "message": "Paper already in library; linked to project."}

    # Create new paper from metadata
    new_paper = Paper(
        title=title,
        authors=authors,
        publication_year=publication_year,
        abstract=abstract,
        doi=doi,
        url=url,
        ingestion_status="metadata_only",
        ingestion_error="Imported from scholarly search. Full PDF not yet uploaded."
    )
    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)

    if project_id:
        db.add(ProjectPaper(project_id=project_id, paper_id=new_paper.id))
        db.commit()

    return {"status": "imported", "paper_id": new_paper.id, "message": "Paper metadata added to research library."}
