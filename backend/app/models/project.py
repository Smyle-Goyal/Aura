import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    research_question = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    papers = relationship("ProjectPaper", back_populates="project", cascade="all, delete-orphan")
    research_runs = relationship("ResearchRun", back_populates="project", cascade="all, delete-orphan")
    comparisons = relationship("PaperComparison", back_populates="project", cascade="all, delete-orphan")
    research_gaps = relationship("CandidateGap", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("ResearchReport", back_populates="project", cascade="all, delete-orphan")
    notes = relationship("ResearchNote", back_populates="project", cascade="all, delete-orphan")
