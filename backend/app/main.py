from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal, USE_POSTGIS
from app.api.v1 import auth, projects, sites, analytics, seed
from app.api.v1.seed import populate_seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        populate_seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["Projects"])
app.include_router(sites.router, prefix=f"{settings.API_V1_STR}/sites", tags=["Geospatial Sites"])
app.include_router(
    analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics & Visualizations"]
)
app.include_router(seed.router, prefix=f"{settings.API_V1_STR}/seed", tags=["Database Seed"])


@app.get("/")
def root():
    return {
        "message": "Welcome to Darukaa.Earth Full-Stack Geospatial Analytics Platform API",
        "docs": "/docs",
        "version": settings.VERSION,
        "postgis_enabled": USE_POSTGIS,
    }


@app.get("/health")
def health():
    return {"status": "ok", "postgis": USE_POSTGIS}
