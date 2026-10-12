import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.paper import Paper
from app.schemas.rag import CitationItem, RAGResponse
from app.services.gemini_service import gemini_service
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger(__name__)

class RAGService:
    async def query_paper(
        self,
        db: Session,
        paper_id: str,
        question: str,
        top_k: int = 5
    ) -> RAGResponse:
        """Single-paper scoped evidence retrieval and question answering."""
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise ValueError(f"Paper with id {paper_id} not found.")

        # 1. Embed query
        query_vector = await gemini_service.get_embedding(question)

        # 2. Retrieve top_k chunks scoped strictly to this paper
        raw_hits = qdrant_service.search(
            query_vector=query_vector,
            top_k=top_k,
            paper_id=paper_id
        )

        citations: List[CitationItem] = []
        context_blocks: List[str] = []

        for idx, hit in enumerate(raw_hits):
            payload = hit.get("payload", {})
            citation_id = idx + 1
            page_num = payload.get("page_number")
            section = payload.get("section") or "General"
            snippet = payload.get("content", "").strip()
            score = round(hit.get("score", 0.0), 4)

            citations.append(
                CitationItem(
                    citation_id=citation_id,
                    paper_id=paper.id,
                    paper_title=paper.title,
                    page_number=page_num,
                    section=section,
                    snippet=snippet,
                    similarity_score=score
                )
            )
            context_blocks.append(
                f"Source [{citation_id}] (Page {page_num}, Section: {section}):\n{snippet}"
            )

        if not context_blocks:
            return RAGResponse(
                question=question,
                answer=(
                    f"No relevant indexed passages were found in \"{paper.title}\" for your query. "
                    "Please ensure the paper has finished ingestion and indexing."
                ),
                citations=[],
                model_used=gemini_service.model if gemini_service.is_configured else "offline-grounded-engine",
                retrieval_scope=f"Paper: {paper.title}",
                confidence_assessment="insufficient_evidence",
                retrieved_chunk_count=0
            )

        # 3. Grounded prompt assembly
        prompt = (
            f"You are AURA, an academic research assistant. Answer the user's question relying strictly on the retrieved source excerpts below.\n"
            f"Always cite the sources using bracketed numbers [1], [2], etc., matching the exact excerpts provided.\n"
            f"Do not hallucinate facts or page numbers outside these excerpts.\n\n"
            f"Paper Title: {paper.title}\n"
            f"User Question: {question}\n\n"
            f"Retrieved Excerpts:\n" + "\n\n".join(context_blocks) + "\n\n"
            f"Synthesize a clear, scholarly, well-structured response with inline citations:"
        )

        answer_text = await gemini_service.generate_completion(
            prompt=prompt,
            system_instruction="You are an exacting academic research assistant. Ground all statements in cited evidence."
        )

        return RAGResponse(
            question=question,
            answer=answer_text,
            citations=citations,
            model_used=gemini_service.model if gemini_service.is_configured else "offline-grounded-engine",
            retrieval_scope=f"Single Paper: {paper.title}",
            confidence_assessment="high" if len(citations) >= 3 else "moderate",
            retrieved_chunk_count=len(citations)
        )

    async def query_collection(
        self,
        db: Session,
        project_id: str,
        question: str,
        paper_ids: Optional[List[str]] = None,
        top_k: int = 8
    ) -> RAGResponse:
        """Cross-paper scoped retrieval and synthesis across a research project."""
        query_vector = await gemini_service.get_embedding(question)

        # Search filtered by project or subset of papers
        raw_hits = qdrant_service.search(
            query_vector=query_vector,
            top_k=top_k,
            project_id=project_id,
            paper_ids=paper_ids
        )

        # Map paper titles for context
        paper_lookup = {}
        if paper_ids:
            papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
            for p in papers:
                paper_lookup[p.id] = p.title

        citations: List[CitationItem] = []
        context_blocks: List[str] = []

        for idx, hit in enumerate(raw_hits):
            payload = hit.get("payload", {})
            citation_id = idx + 1
            pid = payload.get("paper_id")
            title = payload.get("paper_title") or paper_lookup.get(pid, f"Paper {pid[:8]}")
            page_num = payload.get("page_number")
            section = payload.get("section") or "General"
            snippet = payload.get("content", "").strip()
            score = round(hit.get("score", 0.0), 4)

            citations.append(
                CitationItem(
                    citation_id=citation_id,
                    paper_id=pid,
                    paper_title=title,
                    page_number=page_num,
                    section=section,
                    snippet=snippet,
                    similarity_score=score
                )
            )
            context_blocks.append(
                f"Source [{citation_id}] (Paper: \"{title}\", Page {page_num}, Section: {section}):\n{snippet}"
            )

        if not context_blocks:
            return RAGResponse(
                question=question,
                answer=(
                    "No relevant indexed passages were found across the selected papers for your query. "
                    "Make sure documents are ingested and associated with this research project."
                ),
                citations=[],
                model_used=gemini_service.model if gemini_service.is_configured else "offline-grounded-engine",
                retrieval_scope=f"Project Scope ({project_id})",
                confidence_assessment="insufficient_evidence",
                retrieved_chunk_count=0
            )

        prompt = (
            f"You are AURA, an academic research assistant. Answer the user's multi-paper research inquiry.\n"
            f"Synthesize the findings across papers, highlighting areas of consensus or divergence.\n"
            f"You MUST cite each claim using the provided source brackets [1], [2], etc.\n"
            f"Distinguish what is explicitly proven in the papers from your synthesis.\n\n"
            f"Inquiry: {question}\n\n"
            f"Retrieved Cross-Paper Passages:\n" + "\n\n".join(context_blocks) + "\n\n"
            f"Provide an evidence-grounded comparative synthesis with traceable citations:"
        )

        answer_text = await gemini_service.generate_completion(
            prompt=prompt,
            system_instruction="You are a senior academic research synthesizer. Ground all claims in citations."
        )

        return RAGResponse(
            question=question,
            answer=answer_text,
            citations=citations,
            model_used=gemini_service.model if gemini_service.is_configured else "offline-grounded-engine",
            retrieval_scope=f"Project Scope ({project_id}) with {len(citations)} sources",
            confidence_assessment="high" if len(citations) >= 4 else "moderate",
            retrieved_chunk_count=len(citations)
        )

rag_service = RAGService()
