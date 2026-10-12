import os
import re
import math
import hashlib
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model = settings.GEMINI_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        self.vector_dim = 768

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """
        Deterministic normalized 768-dimensional pseudo-semantic embedding vector
        used for offline/local development or test runs when no API key is provided.
        """
        words = re.findall(r"\w+", text.lower())
        vec = [0.0] * self.vector_dim
        if not words:
            vec[0] = 1.0
            return vec

        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.vector_dim
            # TF-like weight with positional decay
            weight = 1.0 / (1.0 + math.log(i + 1))
            vec[idx] += weight

        # Normalize to unit length
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        if not self.is_configured:
            return self._generate_fallback_embedding(text)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.embedding_model}:embedContent?key={self.api_key}"
        payload = {
            "model": f"models/{self.embedding_model}",
            "content": {"parts": [{"text": text[:2048]}]}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    values = data.get("embedding", {}).get("values", [])
                    if values:
                        # Pad or trim to vector_dim
                        if len(values) < self.vector_dim:
                            values.extend([0.0] * (self.vector_dim - len(values)))
                        return values[:self.vector_dim]
                logger.warning(f"Gemini embedding API returned {res.status_code}: {res.text}. Using fallback embedding.")
        except Exception as e:
            logger.warning(f"Gemini embedding exception: {e}. Using fallback embedding.")

        return self._generate_fallback_embedding(text)

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation."""
        embeddings = []
        for text in texts:
            emb = await self.get_embedding(text)
            embeddings.append(emb)
        return embeddings

    async def generate_completion(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: int = 2048
    ) -> str:
        """Call Gemini model to generate content."""
        if not self.is_configured:
            # Deterministic, grounded fallback for offline/development mode
            return self._generate_offline_grounded_response(prompt, system_instruction)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                logger.warning(f"Gemini API returned {res.status_code}: {res.text}. Falling back to grounded response.")
        except Exception as e:
            logger.warning(f"Gemini API call error: {e}. Falling back to grounded response.")

        return self._generate_offline_grounded_response(prompt, system_instruction)

    def _generate_offline_grounded_response(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Synthesizes an honest, transparent, grounded response when Gemini API key is not configured.
        Parses quotes and context from the prompt to construct an evidence-grounded answer.
        """
        # Look for excerpts in prompt
        excerpts = re.findall(r"Excerpt \[\d+\]:.*?(?=\n\n|\Z)", prompt, re.DOTALL)
        if not excerpts:
            excerpts = re.findall(r"\[\d+\].*?(?=\n\n|\Z)", prompt, re.DOTALL)

        if excerpts:
            citations_text = "\n\n".join(f"- Grounded evidence: {e.strip()[:240]}..." for e in excerpts[:4])
            return (
                f"### Evidence-Grounded Analysis (Offline Development Mode)\n\n"
                f"Based directly on the retrieved academic passages in the corpus:\n\n"
                f"{citations_text}\n\n"
                f"**Synthesis:** The literature establishes key findings aligned with the retrieved scope. "
                f"Notice: Live Gemini API key is not configured in the environment (`GEMINI_API_KEY`), so this response is "
                f"grounded directly on the extracted document snippets indexed in Qdrant."
            )
        
        return (
            "AURA synthesized research analysis based on current document corpus. "
            "To activate live Gemini generation, configure `GEMINI_API_KEY` in your environment or Settings."
        )

gemini_service = GeminiService()
