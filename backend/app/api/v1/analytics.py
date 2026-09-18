from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.site import Site
from app.models.analytics import AnalyticsRecord
from app.schemas.analytics import (
    AnalyticsRecordCreate,
    AnalyticsRecordResponse,
    SiteAnalyticsSummary
)

router = APIRouter()

@router.get("/site/{site_id}", response_model=SiteAnalyticsSummary)
def get_site_analytics(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    records = (
        db.query(AnalyticsRecord)
        .filter(AnalyticsRecord.site_id == site_id)
        .order_by(AnalyticsRecord.timestamp.asc())
        .all()
    )
    
    formatted_records = [
        AnalyticsRecordResponse.model_validate(r) for r in records
    ]
    
    latest = formatted_records[-1] if formatted_records else None

    return SiteAnalyticsSummary(
        site_id=site.id,
        site_name=site.name,
        area_hectares=site.area_hectares,
        latest_metrics=latest,
        records=formatted_records
    )

@router.post("/site/{site_id}", response_model=AnalyticsRecordResponse, status_code=status.HTTP_201_CREATED)
def add_site_analytics_record(
    site_id: int,
    record_in: AnalyticsRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    record = AnalyticsRecord(
        site_id=site_id,
        timestamp=record_in.timestamp,
        period=record_in.period or "Monthly",
        carbon_stock_tco2e=record_in.carbon_stock_tco2e,
        biodiversity_index=record_in.biodiversity_index,
        ndvi_index=record_in.ndvi_index,
        biomass_density_t_ha=record_in.biomass_density_t_ha,
        canopy_cover_pct=record_in.canopy_cover_pct,
        soil_organic_carbon_pct=record_in.soil_organic_carbon_pct,
        species_observed_count=record_in.species_observed_count
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AnalyticsRecordResponse.model_validate(record)
