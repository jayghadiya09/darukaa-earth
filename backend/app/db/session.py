import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

# Render / Heroku style URLs sometimes use postgres://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

USE_POSTGIS = False

if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
                conn.commit()
                USE_POSTGIS = True
            except Exception:
                # Managed Postgres without PostGIS extension privileges — continue with GeoJSON text
                USE_POSTGIS = False
                conn.rollback()
    except Exception:
        if os.getenv("FORCE_POSTGRES", "").lower() in ("1", "true", "yes"):
            raise
        db_path = os.path.join(os.path.dirname(__file__), "../../darukaa_dev.db")
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        db_url = f"sqlite:///{db_path}"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        USE_POSTGIS = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
