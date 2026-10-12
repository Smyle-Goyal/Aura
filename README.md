# AURA — Autonomous Unified Research Assistant

**AURA** is an AI research copilot designed for students, researchers, and academics. It delivers evidence-grounded document ingestion, literature discovery, cross-paper comparison matrices, 11-stage autonomous agentic research workflows, and an evidence-grounded research gap engine.

---

## 🏛️ System Architecture & Highlights

- **Design System**: *Editorial Research Studio meets Intelligent Computing Lab*. Warm paper-white (`#F8F7F3`), deep ink (`#202622`), forest green accents (`#355C4A`), restrained amber (`#C27D38`), and refined serif headings paired with clean sans-serif UI typography.
- **Phase 1: Ingestion & Grounded RAG**: PyPDF parsing with page-level metadata preservation, section detection, sliding-window chunking, deterministic / Gemini embeddings, and Qdrant vector indexing. Verifiable bracketed citations with page numbers and snippets.
- **Phase 2: Research Library & Discovery**: Project workspaces, paper collections, duplicate detection (SHA-256), and external scholarly search via OpenAlex and Semantic Scholar (strictly separating metadata discovery from full-text PDF access).
- **Phase 3: Multi-Paper Intelligence**: Cross-paper semantic retrieval, methodology matrices, dataset & benchmark comparison, explicit consensus claims, and empirical contradiction detection.
- **Phase 4: Agentic Research Workflows**: Stateful 11-stage autonomous research execution with persisted stages, progress tracking, cancellation support, and traceable reports.
- **Phase 5: Research Gap Engine**: Dedicated discovery module across 7 gap categories (*methodological, dataset_coverage, evaluation, generalization_robustness, reproducibility, contradictory_findings, underexplored_applications*). Distinguishes verbatim author limitations from inferred hypotheses.

---

## 🚀 Quick Start Guide (Windows PowerShell)

All dependencies and virtual environments are already set up inside:
```
C:\Users\HP\.gemini\antigravity\scratch\aura
```

### 1. Open Terminal 1: Start the Backend (FastAPI)

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\aura

# Option A: Run via helper script
.\scripts\run_backend.ps1

# Option B: Run directly
$env:PYTHONPATH = "backend"
& "backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health & Diagnostics**: `http://localhost:8000/api/health`

---

### 2. Open Terminal 2: Start the Frontend (React + Vite)

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\aura\frontend

# Start Vite dev server
npm run dev
```

- **Web Application UI**: `http://localhost:5173`

---

### 3. Run the Automated Test Suite

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\aura

# Option A: Run via helper script
.\scripts\run_tests.ps1

# Option B: Run directly
$env:PYTHONPATH = "backend"
& "backend\venv\Scripts\pytest.exe" "backend\tests" -v
```

---

## ⚙️ Environment Configuration (`.env`)

The application works out of the box with embedded SQLite and local Qdrant. You can customize settings in `.env`:

```env
# Optional: Live Gemini API Key for online model inference
GEMINI_API_KEY=your_gemini_api_key_here

# Database URL:
DATABASE_URL=sqlite:///./data/aura.db
# For PostgreSQL in production:
# DATABASE_URL=postgresql://aura_user:aura_pass@localhost:5432/aura_db

# Qdrant Vector DB:
# Defaults to embedded local storage path if QDRANT_URL is omitted:
QDRANT_LOCAL_PATH=./data/qdrant
# Or remote container:
# QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=aura_papers

# Chunking & Upload Settings
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE_MB=50
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=200
```

---

## 🖥️ Connected Frontend Screens

1. **Home Dashboard**: Central research query bar with grounded multi-paper RAG, recent collections, live workflow runs, and citation drawer.
2. **Research Projects**: Workspaces with bound primary research questions, paper counts, and archiving.
3. **Paper Library**: Catalog of ingested publications with chunk stats, search, and filters.
4. **Upload & Ingest**: Multi-PDF drag-and-drop with real-time pipeline stage tracker.
5. **Paper Reader & AI**: Split workspace with readable paper passages and contextual AI chat citing exact chunks.
6. **Multi-Paper Comparison**: Structured matrices for methodologies, datasets/metrics, findings/limitations, consensus, and contradictions.
7. **Research Studio**: Three-part editorial workspace (Project Context & Stepper | Stage Outputs & Synthesis | Evidence Inspector).
8. **Research Gaps**: Dedicated Phase 5 module evaluating 7 gap categories, testable hypotheses, suggested experiments, and review decisions.
9. **Discover Literature**: Live search on OpenAlex and Semantic Scholar with full-text accessibility indicators.
10. **Reports & Writing**: Academic review workspace with Markdown export (`.md`) and browser PDF printing.
11. **Settings & Status**: Real-time dependency health checks, model status, and diagnostics.
