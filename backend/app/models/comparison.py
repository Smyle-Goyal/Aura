import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaperComparison(Base):
    __tablename__ = "paper_comparisons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    research_question = Column(Text, nullable=False)
    paper_ids = Column(Text, nullable=False)  # JSON array of paper IDs
    
    # Structured Comparison Matrices (JSON serialized)
    methodology_matrix = Column(Text, nullable=True)
    dataset_metric_matrix = Column(Text, nullable=True)
    findings_limitations_matrix = Column(Text, nullable=True)
    agreements = Column(Text, nullable=True)        # JSON array of consensus points
    disagreements = Column(Text, nullable=True)     # JSON array of conflicting claims
    synthesis_narrative = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="comparisons")
