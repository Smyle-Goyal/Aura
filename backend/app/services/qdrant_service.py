import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from app.core.config import settings

logger = logging.getLogger(__name__)

class QdrantService:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_dim = 768
        self.client: Optional[QdrantClient] = None
        self._init_client()

    def _init_client(self):
        """Initializes either remote Qdrant client or embedded local storage."""
        try:
            if settings.QDRANT_URL and settings.QDRANT_URL.startswith("http"):
                self.client = QdrantClient(url=settings.QDRANT_URL, timeout=10.0)
                logger.info(f"Connected to remote Qdrant at {settings.QDRANT_URL}")
            else:
                self.client = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
                logger.info(f"Using embedded local Qdrant at {settings.QDRANT_LOCAL_PATH}")
            self._ensure_collection()
        except Exception as e:
            logger.warning(f"Error initializing Qdrant at configured target: {e}. Falling back to in-memory Qdrant.")
            try:
                self.client = QdrantClient(":memory:")
                self._ensure_collection()
            except Exception as ex:
                logger.error(f"Failed to initialize in-memory Qdrant: {ex}")
                self.client = None

    def _ensure_collection(self):
        if not self.client:
            return
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=rest_models.VectorParams(
                        size=self.vector_dim,
                        distance=rest_models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def check_health(self) -> Dict[str, Any]:
        if not self.client:
            return {"status": "unavailable", "mode": "uninitialized"}
        try:
            cols = self.client.get_collections().collections
            mode = "remote" if settings.QDRANT_URL else "embedded_local"
            return {
                "status": "healthy",
                "mode": mode,
                "collection": self.collection_name,
                "collection_count": len(cols)
            }
        except Exception as e:
            return {"status": "degraded", "error": str(e)}

    def upsert_chunks(self, points: List[Dict[str, Any]]) -> bool:
        """
        Upsert a batch of points.
        Each point dict should have: id (int or str uuid), vector (List[float]), payload (dict).
        """
        if not self.client or not points:
            return False

        qdrant_points = []
        for p in points:
            qdrant_points.append(
                rest_models.PointStruct(
                    id=p["id"],
                    vector=p["vector"],
                    payload=p["payload"]
                )
            )

        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=qdrant_points
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert points to Qdrant: {e}")
            return False

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        project_id: Optional[str] = None,
        paper_id: Optional[str] = None,
        paper_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for nearest vectors, optionally filtered by project or paper scopes.
        """
        if not self.client:
            return []

        must_conditions = []
        if paper_id:
            must_conditions.append(
                rest_models.FieldCondition(
                    key="paper_id",
                    match=rest_models.MatchValue(value=paper_id)
                )
            )
        elif paper_ids and len(paper_ids) > 0:
            must_conditions.append(
                rest_models.FieldCondition(
                    key="paper_id",
                    match=rest_models.MatchAny(any=paper_ids)
                )
            )

        if project_id:
            must_conditions.append(
                rest_models.FieldCondition(
                    key="project_ids",
                    match=rest_models.MatchAny(any=[project_id])
                )
            )

        query_filter = rest_models.Filter(must=must_conditions) if must_conditions else None

        try:
            # Compatibility with different qdrant_client versions (search vs query_points)
            if hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=top_k,
                    query_filter=query_filter
                )
            else:
                response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=top_k,
                    query_filter=query_filter
                )
                results = response.points

            formatted = []
            for hit in results:
                formatted.append({
                    "id": hit.id,
                    "score": float(hit.score),
                    "payload": hit.payload or {}
                })
            return formatted
        except Exception as e:
            logger.error(f"Error querying Qdrant: {e}")
            return []

    def delete_paper_vectors(self, paper_id: str) -> bool:
        """Removes all vector embeddings for a given paper_id."""
        if not self.client:
            return False
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=rest_models.FilterSelector(
                    filter=rest_models.Filter(
                        must=[
                            rest_models.FieldCondition(
                                key="paper_id",
                                match=rest_models.MatchValue(value=paper_id)
                            )
                        ]
                    )
                )
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete paper vectors for {paper_id}: {e}")
            return False

qdrant_service = QdrantService()
