from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.paper import ProjectPaper
from app.models.research_run import ResearchRun
from app.models.report import ResearchReport
from app.models.research_gap import CandidateGap
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse

router = APIRouter(prefix="/projects", tags=["Research Projects"])

def _to_project_response(p: Project, db: Session) -> ProjectResponse:
    paper_count = db.query(ProjectPaper).filter(ProjectPaper.project_id == p.id).count()
    run_count = db.query(ResearchRun).filter(ResearchRun.project_id == p.id).count()
    report_count = db.query(ResearchReport).filter(ResearchReport.project_id == p.id).count()
    gap_count = db.query(CandidateGap).filter(CandidateGap.project_id == p.id).count()

    return ProjectResponse(
        id=p.id,
        title=p.title,
        description=p.description,
        research_question=p.research_question,
        is_archived=p.is_archived,
        created_at=p.created_at,
        updated_at=p.updated_at,
        paper_count=paper_count,
        run_count=run_count,
        report_count=report_count,
        gap_count=gap_count
    )

@router.get("", response_model=List[ProjectResponse])
def list_projects(include_archived: bool = Query(False), db: Session = Depends(get_db)):
    query = db.query(Project)
    if not include_archived:
        query = query.filter(Project.is_archived == False)
    projects = query.order_by(Project.updated_at.desc()).all()
    return [_to_project_response(p, db) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        title=project_in.title,
        description=project_in.description,
        research_question=project_in.research_question
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_project_response(project, db)

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    base_resp = _to_project_response(project, db)
    papers = db.query(ProjectPaper).filter(ProjectPaper.project_id == project.id).all()
    paper_ids = [p.paper_id for p in papers]

    return ProjectDetailResponse(
        **base_resp.model_dump(),
        paper_ids=paper_ids
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_in.title is not None:
        project.title = project_in.title
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.research_question is not None:
        project.research_question = project_in.research_question
    if project_in.is_archived is not None:
        project.is_archived = project_in.is_archived

    db.commit()
    db.refresh(project)
    return _to_project_response(project, db)

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
