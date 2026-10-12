import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResearchRun(Base):
    __tablename__ = "research_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    objective = Column(Text, nullable=False)
    status = Column(String(50), default="pending", index=True)  # pending, running, completed, failed, cancelled
    progress_percent = Column(Integer, default=0)
    current_stage_name = Column(String(100), default="Initialization")
    selected_paper_ids = Column(Text, nullable=True)  # JSON list of paper IDs
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="research_runs")
    stages = relationship("WorkflowStage", back_populates="run", cascade="all, delete-orphan", order_by="WorkflowStage.stage_index")

class WorkflowStage(Base):
    __tablename__ = "workflow_stages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("research_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_index = Column(Integer, nullable=False)
    stage_name = Column(String(100), nullable=False)
    status = Column(String(50), default="pending")  # pending, running, completed, failed, skipped
    input_payload = Column(Text, nullable=True)   # JSON string
    output_payload = Column(Text, nullable=True)  # JSON string
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    run = relationship("ResearchRun", back_populates="stages")
