import json
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from shapely.geometry import shape
from datetime import datetime, timezone, timedelta
from geoalchemy2.shape import from_shape

from app.api.deps import get_db, get_current_user
from app.db.session import USE_POSTGIS
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.analytics import AnalyticsRecord
from app.schemas.site import SiteCreate, SiteResponse

router = APIRouter()


def calculate_geojson_metrics(boundary_geojson: dict):
    """Parse GeoJSON, return area (ha), centroid, and normalized geometry dict."""
    try:
        geom_dict = boundary_geojson.get("geometry", boundary_geojson)
        geom = shape(geom_dict)

        centroid = geom.centroid
        centroid_lng = float(centroid.x)
        centroid_lat = float(centroid.y)

        avg_lat_rad = math.radians(centroid_lat)
        meters_per_deg_lat = 111320.0
        meters_per_deg_lng = 111320.0 * math.cos(avg_lat_rad)
        sq_meters_per_sq_deg = meters_per_deg_lat * meters_per_deg_lng
        area_sq_m = abs(geom.area) * sq_meters_per_sq_deg
        area_ha = round(max(area_sq_m / 10000.0, 0.01), 2)

        return area_ha, centroid_lat, centroid_lng, geom_dict, geom
    except Exception:
        return 1.0, 0.0, 0.0, boundary_geojson, None


def site_to_response(db: Session, s: Site) -> SiteResponse:
    latest_record = (
        db.query(AnalyticsRecord)
        .filter(AnalyticsRecord.site_id == s.id)
        .order_by(AnalyticsRecord.timestamp.desc())
        .first()
    )
    return SiteResponse(
        id=s.id,
        project_id=s.project_id,
        name=s.name,
        description=s.description,
        habitat_type=s.habitat_type,
        area_hectares=s.area_hectares,
        boundary_geojson=s.geojson_dict,
        centroid_lat=s.centroid_lat,
        centroid_lng=s.centroid_lng,
        created_at=s.created_at,
        latest_carbon_stock=latest_record.carbon_stock_tco2e if latest_record else 0.0,
        latest_biodiversity_index=latest_record.biodiversity_index if latest_record else 0.0,
        latest_ndvi_index=latest_record.ndvi_index if latest_record else 0.0,
    )


@router.get("/", response_model=List[SiteResponse])
def list_sites(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Site)
    if project_id:
        query = query.filter(Site.project_id == project_id)
    return [site_to_response(db, s) for s in query.all()]


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == site_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Parent Project not found")

    area_ha, c_lat, c_lng, geom_dict, shapely_geom = calculate_geojson_metrics(
        site_in.boundary_geojson
    )

    site_kwargs = dict(
        project_id=site_in.project_id,
        name=site_in.name,
        description=site_in.description,
        habitat_type=site_in.habitat_type,
        area_hectares=area_ha,
        boundary_geojson=json.dumps(geom_dict),
        centroid_lat=c_lat,
        centroid_lng=c_lng,
    )
    if USE_POSTGIS and shapely_geom is not None:
        site_kwargs["boundary"] = from_shape(shapely_geom, srid=4326)

    site = Site(**site_kwargs)
    db.add(site)
    db.commit()
    db.refresh(site)

    now = datetime.now(timezone.utc)
    base_carbon = area_ha * 45.0
    base_bio = 68.0
    base_ndvi = 0.65

    for i in range(6, -1, -1):
        ts = now - timedelta(days=i * 30)
        progress_factor = 1.0 + (6 - i) * 0.04
        record = AnalyticsRecord(
            site_id=site.id,
            timestamp=ts,
            period="Monthly",
            carbon_stock_tco2e=round(base_carbon * progress_factor, 2),
            biodiversity_index=round(min(base_bio + (6 - i) * 1.5, 98.0), 1),
            ndvi_index=round(min(base_ndvi + (6 - i) * 0.02, 0.95), 2),
            biomass_density_t_ha=round(42.0 * progress_factor, 1),
            canopy_cover_pct=round(min(62.0 + (6 - i) * 1.2, 95.0), 1),
            soil_organic_carbon_pct=round(2.8 + (6 - i) * 0.1, 2),
            species_observed_count=int(24 + (6 - i) * 2),
        )
        db.add(record)

    db.commit()
    return site_to_response(db, site)


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site_to_response(db, site)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
    return None
