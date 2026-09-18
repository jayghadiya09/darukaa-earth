from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).offset(skip).limit(limit).all()
    res = []
    for p in projects:
        sites_count = db.query(func.count(Site.id)).filter(Site.project_id == p.id).scalar() or 0
        total_area = db.query(func.sum(Site.area_hectares)).filter(Site.project_id == p.id).scalar() or 0.0
        
        p_res = ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            project_type=p.project_type,
            country=p.country,
            region=p.region,
            status=p.status,
            target_carbon_tco2e=p.target_carbon_tco2e,
            owner_id=p.owner_id,
            created_at=p.created_at,
            sites_count=sites_count,
            total_area_ha=round(float(total_area), 2)
        )
        res.append(p_res)
    return res

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(
        name=project_in.name,
        description=project_in.description,
        project_type=project_in.project_type,
        country=project_in.country,
        region=project_in.region,
        status=project_in.status,
        target_carbon_tco2e=project_in.target_carbon_tco2e,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        country=project.country,
        region=project.region,
        status=project.status,
        target_carbon_tco2e=project.target_carbon_tco2e,
        owner_id=project.owner_id,
        created_at=project.created_at,
        sites_count=0,
        total_area_ha=0.0
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    sites_count = db.query(func.count(Site.id)).filter(Site.project_id == project.id).scalar() or 0
    total_area = db.query(func.sum(Site.area_hectares)).filter(Site.project_id == project.id).scalar() or 0.0

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        country=project.country,
        region=project.region,
        status=project.status,
        target_carbon_tco2e=project.target_carbon_tco2e,
        owner_id=project.owner_id,
        created_at=project.created_at,
        sites_count=sites_count,
        total_area_ha=round(float(total_area), 2)
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
        
    db.commit()
    db.refresh(project)
    
    sites_count = db.query(func.count(Site.id)).filter(Site.project_id == project.id).scalar() or 0
    total_area = db.query(func.sum(Site.area_hectares)).filter(Site.project_id == project.id).scalar() or 0.0

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        project_type=project.project_type,
        country=project.country,
        region=project.region,
        status=project.status,
        target_carbon_tco2e=project.target_carbon_tco2e,
        owner_id=project.owner_id,
        created_at=project.created_at,
        sites_count=sites_count,
        total_area_ha=round(float(total_area), 2)
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(project)
    db.commit()
    return None
