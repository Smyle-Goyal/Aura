from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.rag import SinglePaperQueryRequest, MultiPaperQueryRequest, RAGResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["Retrieval-Augmented Generation"])

@router.post("/query/paper", response_model=RAGResponse)
async def query_single_paper(
    query_in: SinglePaperQueryRequest,
    db: Session = Depends(get_db)
):
    try:
        return await rag_service.query_paper(
            db=db,
            paper_id=query_in.paper_id,
            question=query_in.question,
            top_k=query_in.top_k
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(e)}")

@router.post("/query/collection", response_model=RAGResponse)
async def query_paper_collection(
    query_in: MultiPaperQueryRequest,
    db: Session = Depends(get_db)
):
    try:
        return await rag_service.query_collection(
            db=db,
            project_id=query_in.project_id,
            question=query_in.question,
            paper_ids=query_in.paper_ids,
            top_k=query_in.top_k
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cross-paper RAG processing failed: {str(e)}")
