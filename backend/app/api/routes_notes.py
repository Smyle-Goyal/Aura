from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report import ResearchNote
from app.schemas.report import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter(prefix="/notes", tags=["Research Notes"])

@router.get("", response_model=List[NoteResponse])
def list_notes(
    project_id: Optional[str] = Query(None),
    paper_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ResearchNote)
    if project_id:
        query = query.filter(ResearchNote.project_id == project_id)
    if paper_id:
        query = query.filter(ResearchNote.paper_id == paper_id)
    notes = query.order_by(ResearchNote.updated_at.desc()).all()
    return [NoteResponse.model_validate(n) for n in notes]

@router.post("", response_model=NoteResponse, status_code=201)
def create_note(note_in: NoteCreate, db: Session = Depends(get_db)):
    note = ResearchNote(
        project_id=note_in.project_id,
        paper_id=note_in.paper_id,
        title=note_in.title,
        content=note_in.content,
        tags=note_in.tags
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteResponse.model_validate(note)

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, note_in: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(ResearchNote).filter(ResearchNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.tags is not None:
        note.tags = note_in.tags

    db.commit()
    db.refresh(note)
    return NoteResponse.model_validate(note)

@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(ResearchNote).filter(ResearchNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return None
