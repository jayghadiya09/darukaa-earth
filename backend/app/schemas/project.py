from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: Optional[str] = "Carbon Offset"
    country: Optional[str] = "India"
    region: Optional[str] = None
    status: Optional[str] = "Active"
    target_carbon_tco2e: Optional[float] = 0.0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None
    target_carbon_tco2e: Optional[float] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: Optional[int] = None
    created_at: datetime
    sites_count: Optional[int] = 0
    total_area_ha: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
