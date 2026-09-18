from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class SiteBase(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    habitat_type: Optional[str] = "Tropical Forest"

class SiteCreate(SiteBase):
    boundary_geojson: Dict[str, Any]

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    habitat_type: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None

class SiteResponse(SiteBase):
    id: int
    area_hectares: float
    boundary_geojson: Dict[str, Any]
    centroid_lat: float
    centroid_lng: float
    created_at: datetime
    latest_carbon_stock: Optional[float] = 0.0
    latest_biodiversity_index: Optional[float] = 0.0
    latest_ndvi_index: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
