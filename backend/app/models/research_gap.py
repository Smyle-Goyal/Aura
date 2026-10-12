import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CandidateGap(Base):
    __tablename__ = "candidate_gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # methodological, dataset_coverage, evaluation, generalization_robustness, reproducibility, contradictory_findings, underexplored_applications
    
    # Traceable evidence & references (JSON serialized)
    supporting_papers = Column(Text, nullable=True)          # List of {paper_id, title, passage, page}
    author_stated_limitations = Column(Text, nullable=True)  # List of direct limitations stated by authors
    conflicting_findings = Column(Text, nullable=True)       # Counterevidence or opposing findings
    significance_rationale = Column(Text, nullable=True)     # Why this gap matters academically/practically
    candidate_research_questions = Column(Text, nullable=True) # List of candidate research questions
    testable_hypotheses = Column(Text, nullable=True)        # List of explicit hypotheses
    suggested_experiments = Column(Text, nullable=True)      # Concrete suggested experiments
    potential_metrics = Column(Text, nullable=True)          # Evaluation benchmarks/metrics
    
    # Grounding & Reliability
    evidence_strength = Column(String(50), default="moderate")  # strong, moderate, preliminary, insufficient
    evidence_justification = Column(Text, nullable=True)
    missing_evidence_notes = Column(Text, nullable=True)
    uncertainty_rating = Column(String(20), default="medium")   # low, medium, high
    
    # User Decision State
    review_status = Column(String(50), default="unreviewed")    # unreviewed, promising, rejected, investigating
    user_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="research_gaps")
    review_decisions = relationship("GapReviewDecision", back_populates="gap", cascade="all, delete-orphan")

class GapReviewDecision(Base):
    __tablename__ = "gap_review_decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gap_id = Column(String(36), ForeignKey("candidate_gaps.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(50), nullable=False)  # promising, rejected, investigating
    reviewer_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    gap = relationship("CandidateGap", back_populates="review_decisions")
