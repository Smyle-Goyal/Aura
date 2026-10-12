import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.research_run import ResearchRun, WorkflowStage
from app.schemas.workflow import (
    ResearchRunCreate,
    ResearchRunResponse,
    ResearchRunDetailResponse,
    WorkflowStageResponse
)
from app.services.workflow_engine import workflow_engine

router = APIRouter(prefix="/workflows", tags=["Agentic Research Workflows"])

def _to_run_response(r: ResearchRun) -> ResearchRunResponse:
    paper_ids = json.loads(r.selected_paper_ids) if r.selected_paper_ids else []
    return ResearchRunResponse(
        id=r.id,
        project_id=r.project_id,
        objective=r.objective,
        status=r.status,
        progress_percent=r.progress_percent,
        current_stage_name=r.current_stage_name,
        selected_paper_ids=paper_ids,
        error_message=r.error_message,
        started_at=r.started_at,
        completed_at=r.completed_at,
        created_at=r.created_at
    )

@router.post("/runs", response_model=ResearchRunDetailResponse, status_code=201)
async def create_research_run(
    run_in: ResearchRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = ResearchRun(
        project_id=run_in.project_id,
        objective=run_in.objective,
        status="pending",
        progress_percent=0,
        current_stage_name="Queued",
        selected_paper_ids=json.dumps(run_in.paper_ids) if run_in.paper_ids else None
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Launch workflow engine in background
    background_tasks.add_task(workflow_engine.execute_run_async, run.id)

    base = _to_run_response(run)
    return ResearchRunDetailResponse(**base.model_dump(), stages=[])

@router.get("/runs", response_model=List[ResearchRunResponse])
def list_research_runs(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ResearchRun)
    if project_id:
        query = query.filter(ResearchRun.project_id == project_id)
    runs = query.order_by(ResearchRun.created_at.desc()).all()
    return [_to_run_response(r) for r in runs]

@router.get("/runs/{run_id}", response_model=ResearchRunDetailResponse)
def get_research_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ResearchRun).filter(ResearchRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Research run not found")

    base = _to_run_response(run)
    stages = db.query(WorkflowStage).filter(WorkflowStage.run_id == run.id).order_by(WorkflowStage.stage_index).all()
    
    stage_responses = []
    for s in stages:
        stage_responses.append(
            WorkflowStageResponse(
                id=s.id,
                stage_index=s.stage_index,
                stage_name=s.stage_name,
                status=s.status,
                summary=s.summary,
                input_payload=json.loads(s.input_payload) if s.input_payload else None,
                output_payload=json.loads(s.output_payload) if s.output_payload else None,
                started_at=s.started_at,
                completed_at=s.completed_at
            )
        )

    return ResearchRunDetailResponse(**base.model_dump(), stages=stage_responses)

@router.post("/runs/{run_id}/cancel")
def cancel_research_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ResearchRun).filter(ResearchRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Research run not found")

    workflow_engine.cancel_run(run_id)
    run.status = "cancelled"
    db.commit()
    return {"status": "success", "message": f"Run {run_id} marked for cancellation."}
