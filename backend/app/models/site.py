from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, event
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.db.session import Base, USE_POSTGIS


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    habitat_type = Column(String, default="Tropical Forest")
    area_hectares = Column(Float, default=0.0)
    # Always store GeoJSON text for API portability (SQLite + Postgres)
    boundary_geojson = Column(Text, nullable=False)
    # PostGIS geometry when running against PostgreSQL + PostGIS
    boundary = (
        Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
        if USE_POSTGIS
        else Column(Text, nullable=True)
    )
    centroid_lat = Column(Float, nullable=False, default=0.0)
    centroid_lng = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="sites")
    analytics_records = relationship(
        "AnalyticsRecord", back_populates="site", cascade="all, delete-orphan"
    )

    @property
    def geojson_dict(self):
        try:
            return json.loads(self.boundary_geojson)
        except Exception:
            return {}
