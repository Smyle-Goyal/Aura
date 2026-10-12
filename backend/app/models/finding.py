import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExtractedFinding(Base):
    __tablename__ = "extracted_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # methodology, dataset, metric, finding, limitation, implication
    claim = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    confidence = Column(String(20), default="high")  # high, medium, preliminary
    is_explicit_statement = Column(Boolean, default=True)  # True = verbatim/explicit in paper, False = model synthesis
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="findings")
    evidence_references = relationship("EvidenceReference", back_populates="finding", cascade="all, delete-orphan")

class EvidenceReference(Base):
    __tablename__ = "evidence_references"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id = Column(String(36), ForeignKey("extracted_findings.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String(36), nullable=False, index=True)
    chunk_id = Column(String(36), nullable=True)
    page_number = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    quoted_passage = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    finding = relationship("ExtractedFinding", back_populates="evidence_references")
