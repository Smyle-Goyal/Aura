import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.report import ResearchReport, ResearchNote
from app.models.paper import Paper
from app.schemas.report import ReportCreate, ReportResponse

logger = logging.getLogger(__name__)

class ReportService:
    def create_report(self, db: Session, report_in: ReportCreate) -> ReportResponse:
        report = ResearchReport(
            project_id=report_in.project_id,
            run_id=report_in.run_id,
            title=report_in.title,
            abstract=report_in.abstract,
            content_markdown=report_in.content_markdown,
            structured_sections=json.dumps(report_in.structured_sections) if report_in.structured_sections else None,
            citations=json.dumps(report_in.citations) if report_in.citations else None
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return self._to_response(report)

    def get_report(self, db: Session, report_id: str) -> Optional[ReportResponse]:
        report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
        if not report:
            return None
        return self._to_response(report)

    def list_reports(self, db: Session, project_id: Optional[str] = None) -> List[ReportResponse]:
        query = db.query(ResearchReport)
        if project_id:
            query = query.filter(ResearchReport.project_id == project_id)
        reports = query.order_by(ResearchReport.created_at.desc()).all()
        return [self._to_response(r) for r in reports]

    def _to_response(self, r: ResearchReport) -> ReportResponse:
        return ReportResponse(
            id=r.id,
            project_id=r.project_id,
            run_id=r.run_id,
            title=r.title,
            abstract=r.abstract,
            content_markdown=r.content_markdown,
            structured_sections=json.loads(r.structured_sections) if r.structured_sections else None,
            citations=json.loads(r.citations) if r.citations else None,
            created_at=r.created_at,
            updated_at=r.updated_at
        )

report_service = ReportService()
