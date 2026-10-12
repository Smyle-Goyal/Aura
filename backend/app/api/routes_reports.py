from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report import ResearchReport
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Research Reports"])

@router.get("", response_model=List[ReportResponse])
def list_reports(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return report_service.list_reports(db, project_id)

@router.post("", response_model=ReportResponse, status_code=201)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db)
):
    return report_service.create_report(db, report_in)

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    rep = report_service.get_report(db, report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Research report not found")
    return rep

@router.get("/{report_id}/export/markdown")
def export_report_markdown(report_id: str, db: Session = Depends(get_db)):
    rep = report_service.get_report(db, report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Research report not found")

    content = f"# {rep.title}\n\n"
    if rep.abstract:
        content += f"> **Abstract:** {rep.abstract}\n\n"
    content += rep.content_markdown

    filename = f"{rep.title.lower().replace(' ', '_')[:40]}.md"
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )
