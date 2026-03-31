"""
InputAgent — Rule 1: Distance Standardization
Accepts distance_km from the API, derives distance_m internally.
"""
from typing import Dict, Any
import uuid


class InputAgent:
    """Parses and validates the API payload into the shared pipeline state dict."""

    def process(self, payload: dict) -> Dict[str, Any]:
        # ── Rule 1: Distance_m = Distance_km × 1000 ─────────────────────
        distance_km: float = payload.get("distance_km", 0.0)
        distance_m:  float = distance_km * 1000.0

        # ── Unit rates with What-If Inflation ──────────────────
        labor_inf    = 1.0 + (payload.get("labor_inflation", 0.0) / 100.0)
        material_inf = 1.0 + (payload.get("material_inflation", 0.0) / 100.0)

        return {
            "project_id":   payload.get("project_id", str(uuid.uuid4())),
            "raw_input":    payload,

            # Distances (both kept for convenience)
            "distance_km":  distance_km,   # used in Rule 18: CostPerKM
            "distance_m":   distance_m,    # used by all material/labor rules

            # Classification
            "project_type": payload.get("project_type", "new"),
            "build_type":   payload.get("build_type",   "overhead"),
            "area_type":    payload.get("area_type",    "urban"),
            "complexity":   payload.get("complexity",   "low"),

            # Unit rates
            "rates": {
                "cable":            payload.get("cable_rate",             45.0) * material_inf,
                "pole":             payload.get("pole_rate",            3000.0) * material_inf,
                "duct":             payload.get("duct_rate",             500.0) * material_inf,
                "joint_box":        payload.get("joint_box_rate",        1500.0) * material_inf,
                "labor_per_day":    payload.get("labor_rate_per_day",   1200.0) * labor_inf,
                "equipment_per_day":payload.get("equipment_rate_per_day",  0.0) * labor_inf,
            },

            # Boolean flags (Rule 15, 16)
            "flags": {
                "permission_required": payload.get("permission_required", False),
                "equipment_required":  payload.get("equipment_required",  False),
            },

            # Filled by downstream agents
            "multipliers":       {},
            "mode_flags":        {},
            "derived_materials": {},
            "derived_labor":     {},
            "derived_overhead":  {},
            "costs":             {},
        }
