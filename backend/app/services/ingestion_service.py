import os
import re
import uuid
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import pypdf
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.paper import Paper, ProjectPaper, PaperChunk
from app.models.ingestion import IngestionJob
from app.services.gemini_service import gemini_service
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger(__name__)

SECTION_PATTERNS = [
    (r"(?i)\b(abstract)\b", "Abstract"),
    (r"(?i)\b(introduction)\b", "Introduction"),
    (r"(?i)\b(related work|background|literature review)\b", "Related Work"),
    (r"(?i)\b(methodology|method|methods|approach|architecture|system model)\b", "Methodology"),
    (r"(?i)\b(experiments|experimental setup|evaluation|benchmarks|datasets)\b", "Experiments"),
    (r"(?i)\b(results|findings|empirical analysis)\b", "Results"),
    (r"(?i)\b(discussion|ablation study|error analysis)\b", "Discussion"),
    (r"(?i)\b(limitations|threats to validity|future work)\b", "Limitations"),
    (r"(?i)\b(conclusion|concluding remarks)\b", "Conclusion"),
    (r"(?i)\b(references|bibliography)\b", "References"),
]

class IngestionService:
    def compute_sha256(self, file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def validate_pdf(self, filename: str, file_size: int, file_bytes: bytes) -> Tuple[bool, Optional[str]]:
        if not filename.lower().endswith(".pdf"):
            return False, "File must be a PDF document (.pdf extension required)."
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            return False, f"File size exceeds maximum permitted limit ({settings.MAX_FILE_SIZE_MB}MB)."
        if len(file_bytes) < 10 or not file_bytes.startswith(b"%PDF"):
            return False, "Invalid PDF binary signature (magic header missing)."
        return True, None

    def detect_section(self, text_slice: str, current_section: str) -> str:
        first_lines = text_slice.strip().split("\n")[:3]
        sample = " ".join(first_lines)
        for pattern, sec_name in SECTION_PATTERNS:
            if re.search(pattern, sample):
                return sec_name
        return current_section

    def chunk_text(self, text: str, page_num: int, start_section: str = "General") -> List[Dict[str, Any]]:
        """
        Splits page text into overlapping windows while tracking sections.
        Chunk parameters: settings.DEFAULT_CHUNK_SIZE, settings.DEFAULT_CHUNK_OVERLAP.
        """
        chunk_size = settings.DEFAULT_CHUNK_SIZE
        overlap = settings.DEFAULT_CHUNK_OVERLAP
        chunks = []
        
        current_section = start_section
        
        # Clean excessive spacing
        cleaned = re.sub(r"\r\n|\r", "\n", text)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        
        if len(cleaned) <= chunk_size:
            current_section = self.detect_section(cleaned, current_section)
            chunks.append({
                "content": cleaned.strip(),
                "page_number": page_num,
                "section": current_section
            })
            return chunks

        start = 0
        while start < len(cleaned):
            end = min(start + chunk_size, len(cleaned))
            # Try to break at a paragraph or sentence boundary if possible
            if end < len(cleaned):
                break_point = cleaned.rfind("\n\n", start + overlap, end)
                if break_point == -1:
                    break_point = cleaned.rfind(". ", start + overlap, end)
                    if break_point != -1:
                        end = break_point + 1
                else:
                    end = break_point

            chunk_slice = cleaned[start:end].strip()
            if len(chunk_slice) > 20:
                current_section = self.detect_section(chunk_slice, current_section)
                chunks.append({
                    "content": chunk_slice,
                    "page_number": page_num,
                    "section": current_section
                })

            start = max(start + 1, end - overlap)

        return chunks

    async def ingest_paper(self, db: Session, paper_id: str, job_id: Optional[str] = None) -> bool:
        """
        Full ingestion pipeline:
        1. Read saved PDF file
        2. Extract pages and metadata with PyPDF
        3. Chunk text with page and section preservation
        4. Embed chunks with Gemini / fallback
        5. Index into Qdrant
        6. Persist records in DB
        """
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper or not paper.file_path or not os.path.exists(paper.file_path):
            if paper:
                paper.ingestion_status = "failed"
                paper.ingestion_error = "File does not exist on storage disk."
                db.commit()
            return False

        # Create or update IngestionJob
        job = None
        if job_id:
            job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
        if not job:
            job = IngestionJob(
                paper_id=paper.id,
                status="parsing",
                current_stage="Parsing PDF pages",
                started_at=datetime.utcnow()
            )
            db.add(job)
        else:
            job.status = "parsing"
            job.current_stage = "Parsing PDF pages"
            job.started_at = datetime.utcnow()
            job.error_message = None

        paper.ingestion_status = "processing"
        paper.ingestion_error = None
        db.commit()

        try:
            # 1. Parse PDF
            reader = pypdf.PdfReader(paper.file_path)
            num_pages = len(reader.pages)
            paper.page_count = num_pages
            job.total_pages = num_pages

            # Extract basic PDF metadata if available
            try:
                pdf_meta = reader.metadata
                if pdf_meta and pdf_meta.title and (paper.title.endswith(".pdf") or not paper.title):
                    clean_title = str(pdf_meta.title).strip()
                    if len(clean_title) > 3:
                        paper.title = clean_title
                if pdf_meta and pdf_meta.author and not paper.authors:
                    paper.authors = str(pdf_meta.author).strip()
            except Exception as meta_ex:
                logger.warning(f"Metadata extraction notice: {meta_ex}")

            # 2. Extract and Chunk
            job.current_stage = "Chunking text and detecting sections"
            db.commit()

            raw_chunks: List[Dict[str, Any]] = []
            current_sec = "Title & Abstract"

            first_page_text = ""
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if idx == 0:
                    first_page_text = page_text
                page_chunks = self.chunk_text(page_text, page_num=idx + 1, start_section=current_sec)
                if page_chunks:
                    current_sec = page_chunks[-1]["section"]
                raw_chunks.extend(page_chunks)

            # Heuristic for abstract if missing
            if not paper.abstract and first_page_text:
                abs_match = re.search(r"(?i)abstract[:\s\n]+(.*?)(?=\n\n|\b(introduction|1\.|1\s+introduction)\b)", first_page_text, re.DOTALL)
                if abs_match:
                    paper.abstract = abs_match.group(1).strip()[:1500]

            job.total_chunks = len(raw_chunks)
            job.current_stage = "Generating vector embeddings"
            db.commit()

            # Clean out any previous chunks in DB and Qdrant for this paper
            db.query(PaperChunk).filter(PaperChunk.paper_id == paper.id).delete()
            qdrant_service.delete_paper_vectors(paper.id)
            db.commit()

            # Get associated project IDs for scope filtering in vector queries
            project_papers = db.query(ProjectPaper).filter(ProjectPaper.paper_id == paper.id).all()
            project_ids = [p.project_id for p in project_papers]

            # 3. Embed and Index in batches
            qdrant_points = []
            chunk_records = []

            batch_size = 20
            for i in range(0, len(raw_chunks), batch_size):
                batch = raw_chunks[i:i + batch_size]
                texts = [c["content"] for c in batch]
                embeddings = await gemini_service.get_embeddings_batch(texts)

                for chunk_idx, (chunk_data, emb) in enumerate(zip(batch, embeddings)):
                    global_idx = i + chunk_idx
                    chunk_id = str(uuid.uuid4())
                    
                    # Relational record
                    db_chunk = PaperChunk(
                        id=chunk_id,
                        paper_id=paper.id,
                        chunk_index=global_idx,
                        page_number=chunk_data["page_number"],
                        section=chunk_data["section"],
                        content=chunk_data["content"],
                        token_count=len(chunk_data["content"].split()),
                        qdrant_point_id=chunk_id
                    )
                    chunk_records.append(db_chunk)

                    # Qdrant point payload
                    qdrant_points.append({
                        "id": chunk_id,
                        "vector": emb,
                        "payload": {
                            "paper_id": paper.id,
                            "project_ids": project_ids,
                            "chunk_index": global_idx,
                            "page_number": chunk_data["page_number"],
                            "section": chunk_data["section"],
                            "content": chunk_data["content"],
                            "paper_title": paper.title
                        }
                    })

            # Save chunks to DB
            db.bulk_save_objects(chunk_records)
            db.commit()

            # Upsert into Qdrant
            if qdrant_points:
                job.current_stage = "Indexing vectors in Qdrant"
                db.commit()
                qdrant_service.upsert_chunks(qdrant_points)

            # Success
            paper.ingestion_status = "completed"
            paper.ingestion_error = None
            job.status = "completed"
            job.current_stage = "Finished"
            job.completed_at = datetime.utcnow()
            db.commit()
            return True

        except Exception as e:
            logger.exception(f"Ingestion failed for paper {paper_id}: {e}")
            db.rollback()
            paper.ingestion_status = "failed"
            paper.ingestion_error = str(e)
            job.status = "failed"
            job.current_stage = "Failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
            return False

    def delete_paper(self, db: Session, paper_id: str) -> bool:
        """Deletes a paper, cleans its vector embeddings, and removes disk file."""
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            return False

        # Clean Qdrant vectors
        qdrant_service.delete_paper_vectors(paper.id)

        # Remove file from disk
        if paper.file_path and os.path.exists(paper.file_path):
            try:
                os.remove(paper.file_path)
            except Exception as e:
                logger.warning(f"Could not remove physical file {paper.file_path}: {e}")

        # Remove from database (cascade deletes chunks, jobs, associations, findings)
        db.delete(paper)
        db.commit()
        return True

ingestion_service = IngestionService()
