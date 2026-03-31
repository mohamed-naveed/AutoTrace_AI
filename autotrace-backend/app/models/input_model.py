"""
API Input Model — AutoTrace AI India FTTP Estimation
Currency: INR (₹)  |  Region: India (all states)
"""
from pydantic import BaseModel, Field
from typing import Literal


class EstimateInput(BaseModel):
    # ── Project identity ─────────────────────────────────
    project_name: str = Field(..., description="Human-readable project name")
    project_type: Literal["new", "extension"] = Field(default="new")
    area_type:    Literal["urban", "semi-urban", "rural"] = Field(default="urban")
    build_type:   Literal["overhead", "underground"] = Field(default="overhead")

    # ── Location fields (pan-India) ──────────────────────
    state:    str = Field(default="Tamil Nadu", description="Indian state or UT")
    location: str = Field(default="",           description="City / district / zone")

    # ── Rule 1: User inputs km ───────────────────────────
    distance_km: float = Field(..., gt=0, description="Cable route distance in kilometres")

    # ── Config ───────────────────────────────────────────
    complexity:          Literal["low", "medium", "high"] = Field(default="low")
    permission_required: bool = False
    equipment_required:  bool = False
    created_by:          str  = Field(default="System")
    priority:            Literal["low", "medium", "high"] = Field(default="medium")

    # ── Unit rates — Indian market defaults (INR) ────────
    cable_rate:             float = Field(default=45.0,   description="₹ per metre of cable")
    pole_rate:              float = Field(default=3000.0, description="₹ per pole")
    duct_rate:              float = Field(default=500.0,  description="₹ per duct section")
    joint_box_rate:         float = Field(default=1500.0, description="₹ per joint box")
    labor_rate_per_day:     float = Field(default=1200.0, description="₹ per labour day")
    equipment_rate_per_day: float = Field(default=0.0,    description="₹ per equipment day")

    # ── What-If Scenario Overrides ──────────────────────
    labor_inflation:        float = Field(default=0.0, description="Percentage adjustment for labor cost (e.g., 10.0 for +10%)")
    material_inflation:     float = Field(default=0.0, description="Percentage adjustment for material cost (e.g., -5.0 for -5%)")
