from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AnalyticsRecordBase(BaseModel):
    site_id: int
    timestamp: datetime
    period: Optional[str] = "Monthly"
    carbon_stock_tco2e: float
    biodiversity_index: float
    ndvi_index: float
    biomass_density_t_ha: float
    canopy_cover_pct: float
    soil_organic_carbon_pct: float
    species_observed_count: int

class AnalyticsRecordCreate(AnalyticsRecordBase):
    pass

class AnalyticsRecordResponse(AnalyticsRecordBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class SiteAnalyticsSummary(BaseModel):
    site_id: int
    site_name: str
    area_hectares: float
    latest_metrics: Optional[AnalyticsRecordResponse] = None
    records: List[AnalyticsRecordResponse]
