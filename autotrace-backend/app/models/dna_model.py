"""
Collection: cost_dna
Stores the full traceable audit record for every estimate run.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict
from datetime import datetime


class DerivedMaterials(BaseModel):
    cable_length: float = 0.0   # metres (including 5% wastage)
    poles: float = 0.0
    joint_boxes: float = 0.0
    duct_sections: float = 0.0


class LaborCalculation(BaseModel):
    productivity: float = 0.0   # m/day
    base_days: float = 0.0
    final_days: float = 0.0


class MultipliersApplied(BaseModel):
    area_multiplier: float = 1.0
    complexity_multiplier: float = 1.0
    extension_factor: float = 1.0       # 0.6 when extension, 1.0 otherwise


class ValidationResult(BaseModel):
    deviation_percentage: float = 0.0
    confidence: str = "High"            # High | Medium | Low
    confidence_score: float = 100.0     # 0 to 100
    requires_manual_review: bool = False
    flags: list[str] = Field(default_factory=list)
    rationale_log: list[Dict[str, str]] = Field(default_factory=list)


class CostDNADocument(BaseModel):
    project_id: str = Field(..., description="References the project UUID")

    inputs: Dict[str, Any] = Field(
        ..., description="Original structured inputs from the project"
    )
    derived_materials: DerivedMaterials = Field(default_factory=DerivedMaterials)
    labor_calculation: LaborCalculation = Field(default_factory=LaborCalculation)
    multipliers_applied: MultipliersApplied = Field(default_factory=MultipliersApplied)
    validation_result: ValidationResult = Field(default_factory=ValidationResult)

    # Flattened cost summary for quick reporting
    final_cost: Dict[str, Any] = Field(default_factory=dict)

    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
