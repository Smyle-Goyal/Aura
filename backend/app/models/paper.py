import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(512), nullable=False)
    authors = Column(Text, nullable=True)  # JSON or comma-separated
    publication_year = Column(Integer, nullable=True)
    abstract = Column(Text, nullable=True)
    doi = Column(String(255), nullable=True)
    url = Column(String(1024), nullable=True)
    venue = Column(String(255), nullable=True)
    tags = Column(String(512), nullable=True)
    
    file_path = Column(String(1024), nullable=True)
    file_name = Column(String(512), nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 for duplicate check
    file_size_bytes = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    
    ingestion_status = Column(String(50), default="pending", index=True)  # pending, processing, completed, failed
    ingestion_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project_associations = relationship("ProjectPaper", back_populates="paper", cascade="all, delete-orphan")
    chunks = relationship("PaperChunk", back_populates="paper", cascade="all, delete-orphan")
    ingestion_jobs = relationship("IngestionJob", back_populates="paper", cascade="all, delete-orphan")
    findings = relationship("ExtractedFinding", back_populates="paper", cascade="all, delete-orphan")

class ProjectPaper(Base):
    __tablename__ = "project_papers"
    __table_args__ = (UniqueConstraint("project_id", "paper_id", name="uq_project_paper"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="papers")
    paper = relationship("Paper", back_populates="project_associations")

class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    qdrant_point_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    paper = relationship("Paper", back_populates="chunks")
