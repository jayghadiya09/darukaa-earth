from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float, String
from sqlalchemy.orm import relationship
from app.db.session import Base

class AnalyticsRecord(Base):
    __tablename__ = "analytics_records"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    period = Column(String, default="Monthly")
    
    carbon_stock_tco2e = Column(Float, default=0.0)
    biodiversity_index = Column(Float, default=0.0)
    ndvi_index = Column(Float, default=0.0)
    biomass_density_t_ha = Column(Float, default=0.0)
    canopy_cover_pct = Column(Float, default=0.0)
    soil_organic_carbon_pct = Column(Float, default=0.0)
    species_observed_count = Column(Integer, default=0)

    site = relationship("Site", back_populates="analytics_records")
