"""
Collection: cost_estimates
Stores the final calculated cost breakdown per project.
"""
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class CostEstimateDocument(BaseModel):
    project_id: str = Field(..., description="References the project UUID")
    material_cost: float = Field(default=0.0)
    labor_cost: float = Field(default=0.0)
    permission_cost: float = Field(default=0.0)
    equipment_cost: float = Field(default=0.0)
    total_cost: float = Field(default=0.0)
    confidence_level: Literal["High", "Medium", "Low"] = Field(default="High")
    confidence_score: float = Field(default=100.0)
    requires_manual_review: bool = Field(default=False)
    validation_flag: bool = Field(
        default=False,
        description="True when deviation exceeds threshold or guardrail fails"
    )
    rationale_log: list[dict] = Field(default_factory=list)
    cost_per_km: float = Field(default=0.0)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
