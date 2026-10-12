from pydantic import BaseModel, Field
from typing import Optional, List

class DiscoverySearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    provider: str = Field(default="openalex")  # openalex or semanticscholar
    limit: int = Field(default=10, ge=1, le=50)
    year_start: Optional[int] = None
    year_end: Optional[int] = None

class DiscoveredPaperItem(BaseModel):
    source_id: str
    provider: str
    title: str
    authors: List[str] = []
    publication_year: Optional[int] = None
    venue: Optional[str] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    citation_count: Optional[int] = None
    is_open_access: bool = False
    open_access_pdf_url: Optional[str] = None
    can_download_full_text: bool = False

class DiscoveryResponse(BaseModel):
    query: str
    provider: str
    total_results: int
    papers: List[DiscoveredPaperItem] = []
    external_service_status: str  # available, degraded, mock_fallback
