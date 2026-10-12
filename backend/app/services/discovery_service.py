import logging
import httpx
from typing import List, Dict, Any, Optional

from app.schemas.discovery import DiscoveredPaperItem, DiscoveryResponse

logger = logging.getLogger(__name__)

SAMPLE_FALLBACK_CATALOG = [
    {
        "source_id": "W4285719001",
        "provider": "openalex",
        "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        "authors": ["Patrick Lewis", "Ethan Perez", "Aleksandra Piktus", "Fabio Petroni"],
        "publication_year": 2020,
        "venue": "NeurIPS",
        "abstract": "We explore retrieval-augmented generation (RAG) models, which combine pre-trained parametric and non-parametric memory for language generation. We fine-tune end-to-end models on a diverse set of tasks.",
        "doi": "10.48550/arXiv.2005.11401",
        "url": "https://arxiv.org/abs/2005.11401",
        "citation_count": 4820,
        "is_open_access": True,
        "open_access_pdf_url": "https://arxiv.org/pdf/2005.11401.pdf",
        "can_download_full_text": True
    },
    {
        "source_id": "W3165219010",
        "provider": "openalex",
        "title": "Dense Passage Retrieval for Open-Domain Question Answering",
        "authors": ["Vladimir Karpukhin", "Barlas Oğuz", "Sewon Min", "Patrick Lewis"],
        "publication_year": 2020,
        "venue": "EMNLP",
        "abstract": "Open-domain question answering relies on efficient passage retrieval. We show that retrieval can be practically implemented using dense representations learned from a dual-encoder framework.",
        "doi": "10.18653/v1/2020.emnlp-main.550",
        "url": "https://aclanthology.org/2020.emnlp-main.550/",
        "citation_count": 3150,
        "is_open_access": True,
        "open_access_pdf_url": "https://aclanthology.org/2020.emnlp-main.550.pdf",
        "can_download_full_text": True
    },
    {
        "source_id": "W4389012399",
        "provider": "openalex",
        "title": "Lost in the Middle: How Language Models Use Long Contexts",
        "authors": ["Nelson F. Liu", "Kevin Lin", "John Hewitt", "Ashwin Paranjape"],
        "publication_year": 2024,
        "venue": "Transactions of the ACL",
        "abstract": "We find that language models are significantly better at accessing relevant information when it occurs at the beginning or end of the input context, and degrade markedly when relevant information is in the middle.",
        "doi": "10.1162/tacl_a_00638",
        "url": "https://arxiv.org/abs/2307.03172",
        "citation_count": 1280,
        "is_open_access": True,
        "open_access_pdf_url": "https://arxiv.org/pdf/2307.03172.pdf",
        "can_download_full_text": True
    },
    {
        "source_id": "W2981048201",
        "provider": "openalex",
        "title": "A Survey on Hallucination in Large Language Models: Principles, Taxonomy, Challenges",
        "authors": ["Vipula Rawte", "Amit Sheth", "Amitava Das"],
        "publication_year": 2023,
        "venue": "ACM Computing Surveys",
        "abstract": "Large Language Models often generate hallucinated content that appears plausible but factually incorrect. This survey categorizes detection, mitigation, and benchmark frameworks.",
        "doi": "10.1145/3638530",
        "url": "https://arxiv.org/abs/2309.01219",
        "citation_count": 640,
        "is_open_access": False,
        "open_access_pdf_url": None,
        "can_download_full_text": False
    }
]

class DiscoveryService:
    async def search_papers(
        self,
        query: str,
        provider: str = "openalex",
        limit: int = 10,
        year_start: Optional[int] = None,
        year_end: Optional[int] = None
    ) -> DiscoveryResponse:
        """
        Queries scholarly literature API (OpenAlex or Semantic Scholar).
        Accurately flags full-text availability vs metadata-only access.
        """
        if provider == "semanticscholar":
            return await self._search_semantic_scholar(query, limit)
        return await self._search_openalex(query, limit, year_start, year_end)

    async def _search_openalex(
        self,
        query: str,
        limit: int = 10,
        year_start: Optional[int] = None,
        year_end: Optional[int] = None
    ) -> DiscoveryResponse:
        url = "https://api.openalex.org/works"
        params = {
            "search": query,
            "per-page": limit,
            "mailto": "aura-research@example.org"
        }
        
        filter_parts = []
        if year_start:
            filter_parts.append(f"from_publication_date:{year_start}-01-01")
        if year_end:
            filter_parts.append(f"to_publication_date:{year_end}-12-31")
        if filter_parts:
            params["filter"] = ",".join(filter_parts)

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    items: List[DiscoveredPaperItem] = []

                    for r in results:
                        authors = [a.get("author", {}).get("display_name", "") for a in r.get("authorships", [])]
                        venue = r.get("primary_location", {}).get("source", {}).get("display_name") or "Scholarly Publication"
                        oa = r.get("open_access", {})
                        is_oa = oa.get("is_oa", False)
                        oa_url = oa.get("oa_url")
                        
                        # Full-text accessibility check
                        can_download = bool(is_oa and oa_url and oa_url.endswith(".pdf"))

                        # Abstract reconstruction if inverted index
                        abstract = None
                        inv_index = r.get("abstract_inverted_index")
                        if inv_index:
                            words = []
                            for word, positions in inv_index.items():
                                for pos in positions:
                                    words.append((pos, word))
                            words.sort(key=lambda x: x[0])
                            abstract = " ".join([w[1] for w in words])[:1200]

                        items.append(
                            DiscoveredPaperItem(
                                source_id=r.get("id", "").replace("https://openalex.org/", ""),
                                provider="openalex",
                                title=r.get("title") or "Untitled Work",
                                authors=authors[:5],
                                publication_year=r.get("publication_year"),
                                venue=venue,
                                abstract=abstract,
                                doi=r.get("doi"),
                                url=r.get("doi") or r.get("id"),
                                citation_count=r.get("cited_by_count"),
                                is_open_access=is_oa,
                                open_access_pdf_url=oa_url,
                                can_download_full_text=can_download
                            )
                        )

                    return DiscoveryResponse(
                        query=query,
                        provider="openalex",
                        total_results=data.get("meta", {}).get("count", len(items)),
                        papers=items,
                        external_service_status="available"
                    )
        except Exception as e:
            logger.warning(f"OpenAlex API call exception: {e}. Utilizing scholarly catalog fallback.")

        # Fallback to curated scholarly catalog filtered by query
        filtered = [
            DiscoveredPaperItem(**p) for p in SAMPLE_FALLBACK_CATALOG
            if any(term in p["title"].lower() or term in (p["abstract"] or "").lower() for term in query.lower().split())
        ]
        if not filtered:
            filtered = [DiscoveredPaperItem(**p) for p in SAMPLE_FALLBACK_CATALOG]

        return DiscoveryResponse(
            query=query,
            provider="openalex",
            total_results=len(filtered),
            papers=filtered,
            external_service_status="mock_fallback"
        )

    async def _search_semantic_scholar(self, query: str, limit: int = 10) -> DiscoveryResponse:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": limit,
            "fields": "title,authors,year,abstract,venue,isOpenAccess,openAccessPdf,citationCount,url,externalIds"
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    papers_data = data.get("data", [])
                    items: List[DiscoveredPaperItem] = []
                    for p in papers_data:
                        oa_pdf = p.get("openAccessPdf", {}) or {}
                        pdf_url = oa_pdf.get("url")
                        is_oa = p.get("isOpenAccess", False)
                        can_download = bool(is_oa and pdf_url)
                        authors = [a.get("name", "") for a in p.get("authors", [])]

                        items.append(
                            DiscoveredPaperItem(
                                source_id=p.get("paperId", ""),
                                provider="semanticscholar",
                                title=p.get("title") or "Untitled Work",
                                authors=authors[:5],
                                publication_year=p.get("year"),
                                venue=p.get("venue"),
                                abstract=p.get("abstract"),
                                doi=p.get("externalIds", {}).get("DOI"),
                                url=p.get("url"),
                                citation_count=p.get("citationCount"),
                                is_open_access=is_oa,
                                open_access_pdf_url=pdf_url,
                                can_download_full_text=can_download
                            )
                        )
                    return DiscoveryResponse(
                        query=query,
                        provider="semanticscholar",
                        total_results=data.get("total", len(items)),
                        papers=items,
                        external_service_status="available"
                    )
        except Exception as e:
            logger.warning(f"Semantic Scholar API failed: {e}")

        return DiscoveryResponse(
            query=query,
            provider="semanticscholar",
            total_results=len(SAMPLE_FALLBACK_CATALOG),
            papers=[DiscoveredPaperItem(**p) for p in SAMPLE_FALLBACK_CATALOG],
            external_service_status="mock_fallback"
        )

discovery_service = DiscoveryService()
