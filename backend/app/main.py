import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.db.seed import seed_initial_demo_data
from app.api.routes_health import router as health_router
from app.api.routes_projects import router as projects_router
from app.api.routes_papers import router as papers_router
from app.api.routes_ingestion import router as ingestion_router
from app.api.routes_rag import router as rag_router
from app.api.routes_comparison import router as comparison_router
from app.api.routes_workflow import router as workflow_router
from app.api.routes_gaps import router as gaps_router
from app.api.routes_discovery import router as discovery_router
from app.api.routes_reports import router as reports_router
from app.api.routes_notes import router as notes_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    init_db()
    
    # Run demo seeder in a background session
    db = SessionLocal()
    try:
        await seed_initial_demo_data(db)
    except Exception as e:
        logger.warning(f"Demo seeding warning: {e}")
    finally:
        db.close()
        
    logger.info(f"{settings.PROJECT_NAME} v{settings.VERSION} online.")
    yield
    logger.info("AURA backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Unified Research Assistant — AI Research Copilot for Literature Synthesis & Discovery",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.cors_origin_list
if "*" not in origins and "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(papers_router, prefix="/api")
app.include_router(ingestion_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(comparison_router, prefix="/api")
app.include_router(workflow_router, prefix="/api")
app.include_router(gaps_router, prefix="/api")
app.include_router(discovery_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(notes_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
