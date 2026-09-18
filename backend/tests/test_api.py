import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

# Use in-memory SQLite database for speed and isolation
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Darukaa.Earth" in response.json()["message"]

def test_user_registration_and_login():
    # Register
    reg_data = {
        "email": "testuser@darukaa.earth",
        "password": "securepassword123",
        "full_name": "Test User",
        "role": "administrator"
    }
    res_reg = client.post("/api/v1/auth/register", json=reg_data)
    assert res_reg.status_code == 201
    assert res_reg.json()["email"] == reg_data["email"]

    # Login
    login_data = {
        "username": "testuser@darukaa.earth",
        "password": "securepassword123"
    }
    res_login = client.post("/api/v1/auth/login", data=login_data)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    assert token is not None

    # Get Me
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == reg_data["email"]

def test_project_and_site_flow():
    # 1. Register & Auth
    reg_data = {"email": "admin2@darukaa.earth", "password": "password123", "full_name": "Admin 2"}
    client.post("/api/v1/auth/register", json=reg_data)
    login_res = client.post("/api/v1/auth/login", data={"username": "admin2@darukaa.earth", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Project
    proj_data = {
        "name": "Amazon Rain Forest Conservation",
        "description": "Rainforest protection project",
        "project_type": "Carbon Offset",
        "country": "Brazil",
        "target_carbon_tco2e": 500000.0
    }
    res_p = client.post("/api/v1/projects/", json=proj_data, headers=headers)
    assert res_p.status_code == 201
    proj_id = res_p.json()["id"]

    # 3. Create Site with Polygon GeoJSON
    site_data = {
        "project_id": proj_id,
        "name": "Tapajos Forest Reserve",
        "description": "Core protected sector",
        "habitat_type": "Tropical Rainforest",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [-55.0, -3.0],
                [-54.9, -3.0],
                [-54.9, -2.9],
                [-55.0, -2.9],
                [-55.0, -3.0]
            ]]
        }
    }
    res_s = client.post("/api/v1/sites/", json=site_data, headers=headers)
    assert res_s.status_code == 201
    site_id = res_s.json()["id"]
    assert res_s.json()["area_hectares"] > 0

    # 4. Query Site Analytics
    res_analytics = client.get(f"/api/v1/analytics/site/{site_id}", headers=headers)
    assert res_analytics.status_code == 200
    analytics_json = res_analytics.json()
    assert len(analytics_json["records"]) > 0
    assert analytics_json["site_name"] == "Tapajos Forest Reserve"
