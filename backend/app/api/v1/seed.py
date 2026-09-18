import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.analytics import AnalyticsRecord

router = APIRouter()

def populate_seed_data(db: Session):
    # 1. Ensure Default Admin User
    admin = db.query(User).filter(User.email == "admin@darukaa.earth").first()
    if not admin:
        admin = User(
            email="admin@darukaa.earth",
            hashed_password=get_password_hash("password123"),
            full_name="Darukaa Admin",
            role="administrator"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # If projects already exist, skip duplicate seeding
    if db.query(Project).count() > 0:
        return {"status": "already_seeded", "message": "Database already contains project data."}

    # 2. Seed Sample Carbon & Biodiversity Projects
    projects_data = [
        {
            "name": "Sundarbans Coastal Mangrove Restoration",
            "description": "High-impact blue carbon ecosystem restoration focused on mangrove replanting, coastal protection, and tidal habitat revival.",
            "project_type": "Carbon Offset & Coastal Protection",
            "country": "India",
            "region": "West Bengal",
            "status": "Active",
            "target_carbon_tco2e": 125000.0,
            "sites": [
                {
                    "name": "Gosaba Tidal Wetland Zone",
                    "description": "Primary mangrove afforestation area with dense Rhizophora and Avicennia species.",
                    "habitat_type": "Mangrove Wetland",
                    "area_hectares": 340.5,
                    "centroid_lat": 22.165,
                    "centroid_lng": 88.805,
                    "geojson": {
                        "type": "Polygon",
                        "coordinates": [[
                            [88.790, 22.155],
                            [88.820, 22.155],
                            [88.825, 22.175],
                            [88.795, 22.175],
                            [88.790, 22.155]
                        ]]
                    },
                    "base_carbon": 18200.0,
                    "base_bio": 84.5,
                    "base_ndvi": 0.74,
                    "species": 48
                },
                {
                    "name": "Sajnekhali Bio-Reserve Delta",
                    "description": "Core protected delta ecosystem for Royal Bengal tigers and estuarine crocodiles.",
                    "habitat_type": "Mangrove Reserve",
                    "area_hectares": 412.0,
                    "centroid_lat": 22.120,
                    "centroid_lng": 88.830,
                    "geojson": {
                        "type": "Polygon",
                        "coordinates": [[
                            [88.810, 22.105],
                            [88.850, 22.105],
                            [88.845, 22.135],
                            [88.815, 22.135],
                            [88.810, 22.105]
                        ]]
                    },
                    "base_carbon": 22400.0,
                    "base_bio": 92.0,
                    "base_ndvi": 0.81,
                    "species": 62
                }
            ]
        },
        {
            "name": "Western Ghats Biodiversity & Wildlife Corridor",
            "description": "Continuous tropical rainforest corridor restoration in Nilgiri Biosphere to support endemic fauna and biomass carbon storage.",
            "project_type": "Biodiversity Conservation",
            "country": "India",
            "region": "Tamil Nadu / Kerala",
            "status": "Active",
            "target_carbon_tco2e": 240000.0,
            "sites": [
                {
                    "name": "Silent Valley Evergreen Block",
                    "description": "Unfragmented pristine tropical evergreen rain forest sanctuary.",
                    "habitat_type": "Tropical Rainforest",
                    "area_hectares": 580.0,
                    "centroid_lat": 11.135,
                    "centroid_lng": 76.430,
                    "geojson": {
                        "type": "Polygon",
                        "coordinates": [[
                            [76.410, 11.120],
                            [76.450, 11.120],
                            [76.455, 11.150],
                            [76.415, 11.150],
                            [76.410, 11.120]
                        ]]
                    },
                    "base_carbon": 48500.0,
                    "base_bio": 95.5,
                    "base_ndvi": 0.88,
                    "species": 124
                },
                {
                    "name": "Wayanad Montane Shola Forest",
                    "description": "High-altitude grassland and Shola forest complex protecting watershed sources.",
                    "habitat_type": "Montane Shola",
                    "area_hectares": 290.0,
                    "centroid_lat": 11.605,
                    "centroid_lng": 76.085,
                    "geojson": {
                        "type": "Polygon",
                        "coordinates": [[
                            [76.070, 11.590],
                            [76.100, 11.590],
                            [76.105, 11.620],
                            [76.075, 11.620],
                            [76.070, 11.590]
                        ]]
                    },
                    "base_carbon": 21000.0,
                    "base_bio": 88.0,
                    "base_ndvi": 0.79,
                    "species": 86
                }
            ]
        },
        {
            "name": "Deccan Agroforestry & Soil Carbon Initiative",
            "description": "Regenerative farming and silvopasture expansion enhancing soil organic carbon across smallholder farm clusters.",
            "project_type": "Regenerative Agriculture",
            "country": "India",
            "region": "Maharashtra",
            "status": "Planning",
            "target_carbon_tco2e": 85000.0,
            "sites": [
                {
                    "name": "Pune Semi-Arid Farm Belt",
                    "description": "Agroforestry site integrated with native fruit trees and nitrogen-fixing legumes.",
                    "habitat_type": "Dry Deciduous / Farm",
                    "area_hectares": 215.0,
                    "centroid_lat": 18.520,
                    "centroid_lng": 73.856,
                    "geojson": {
                        "type": "Polygon",
                        "coordinates": [[
                            [73.840, 18.505],
                            [73.870, 18.505],
                            [73.875, 18.535],
                            [73.845, 18.535],
                            [73.840, 18.505]
                        ]]
                    },
                    "base_carbon": 9800.0,
                    "base_bio": 64.0,
                    "base_ndvi": 0.58,
                    "species": 32
                }
            ]
        }
    ]

    now = datetime.now(timezone.utc)

    for p_data in projects_data:
        project = Project(
            name=p_data["name"],
            description=p_data["description"],
            project_type=p_data["project_type"],
            country=p_data["country"],
            region=p_data["region"],
            status=p_data["status"],
            target_carbon_tco2e=p_data["target_carbon_tco2e"],
            owner_id=admin.id
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        for s_data in p_data["sites"]:
            site = Site(
                project_id=project.id,
                name=s_data["name"],
                description=s_data["description"],
                habitat_type=s_data["habitat_type"],
                area_hectares=s_data["area_hectares"],
                boundary_geojson=json.dumps(s_data["geojson"]),
                centroid_lat=s_data["centroid_lat"],
                centroid_lng=s_data["centroid_lng"]
            )
            db.add(site)
            db.commit()
            db.refresh(site)

            # Generate 12 monthly historical records showing positive ecological growth over 1 year
            base_c = s_data["base_carbon"]
            base_b = s_data["base_bio"]
            base_n = s_data["base_ndvi"]
            sp_count = s_data["species"]

            for m in range(12, -1, -1):
                ts = now - timedelta(days=m * 30)
                # Trend factors
                trend = (12 - m) / 12.0  # 0.0 to 1.0
                c_val = round(base_c * (0.82 + 0.18 * trend), 2)
                b_val = round(min(base_b * (0.88 + 0.12 * trend), 99.0), 1)
                n_val = round(min(base_n * (0.85 + 0.15 * trend), 0.96), 2)
                bio_mass = round(s_data["area_hectares"] * 0.14 * (0.85 + 0.15 * trend), 1)
                canopy = round(min(55.0 + 25.0 * trend, 94.0), 1)
                soc = round(1.8 + 1.2 * trend, 2)
                sp_obs = int(sp_count * (0.75 + 0.25 * trend))

                rec = AnalyticsRecord(
                    site_id=site.id,
                    timestamp=ts,
                    period="Monthly",
                    carbon_stock_tco2e=c_val,
                    biodiversity_index=b_val,
                    ndvi_index=n_val,
                    biomass_density_t_ha=bio_mass,
                    canopy_cover_pct=canopy,
                    soil_organic_carbon_pct=soc,
                    species_observed_count=sp_obs
                )
                db.add(rec)
            
            db.commit()

    return {"status": "success", "message": "Database seeded with rich geospatial projects, sites, and analytics records."}

@router.post("/")
def seed_database(db: Session = Depends(get_db)):
    return populate_seed_data(db)
