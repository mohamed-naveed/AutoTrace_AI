"""
Collection: projects
Represents a project record stored in autotrace_db.projects
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid


class ProjectCreate(BaseModel):
    project_name: str = Field(..., description="Descriptive project name")
    project_type: Literal["new", "extension"] = Field(..., description="New deployment or extension")
    area_type: Literal["urban", "rural", "semi-urban"] = Field(..., description="Area classification")
    build_type: Literal["overhead", "underground"] = Field(..., description="Build method")
    distance_m: float = Field(..., gt=0, description="Total cable distance in metres")
    complexity: Literal["low", "medium", "high"] = Field(..., description="Project complexity")
    permission_required: bool = False
    equipment_required: bool = False
    created_by: str = Field(..., description="Name or ID of the creator")
    priority: Literal["low", "medium", "high"] = Field(default="medium")


class ProjectDocument(ProjectCreate):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
