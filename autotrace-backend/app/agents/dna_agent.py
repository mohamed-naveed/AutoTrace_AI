from typing import Dict, Any
from app.utils.helpers import get_complexity_multiplier, get_area_multiplier


class DNAAgent:
    """Structures the pipeline state into the CostDNA audit document format."""

    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        labor  = state["derived_labor"]
        mats   = state["derived_materials"]
        mflags = state.get("material_flags", {})
        costs  = state["costs"]
        inp    = state["raw_input"]

        complexity_mult  = get_complexity_multiplier(state["multipliers"]["complexity"])
        area_mult        = get_area_multiplier(state["multipliers"]["area"])
        is_extension     = state["mode_flags"]["is_extension"]
        extension_factor = 0.6 if is_extension else 1.0

        deviation_pct = state["validation_result"].get("deviation_percentage", 0.0)
        confidence    = state["validation_result"].get("confidence", "High")

        return {
            "project_id": state["project_id"],

            # ── inputs ──────────────────────────────────────────────────────
            "inputs": {
                "project_type":        inp.get("project_type"),
                "area_type":           inp.get("area_type"),
                "build_type":          inp.get("build_type"),
                "distance_km":         inp.get("distance_km"),          # ← human-readable km
                "distance_m":          inp.get("distance_m"),
                "complexity":          inp.get("complexity"),
                "permission_required": inp.get("permission_required"),
                "equipment_required":  inp.get("equipment_required"),
                "is_extension":        is_extension,
            },

            # ── derived_materials ────────────────────────────────────────────
            "derived_materials": {
                "cable_length":  mats.get("cable_length",  0.0),
                "poles":         mats.get("poles",         0.0),
                "duct_sections": mats.get("duct_sections", 0.0),
                "joint_boxes":   mats.get("joint_boxes",   0.0),
            },

            # ── material_flags (extension / uplift flags) ────────────────────
            "material_flags": {
                "underground_uplift_applied":   mflags.get("underground_uplift_applied",   False),
                "extension_reduction_applied":  mflags.get("extension_reduction_applied",  False),
                "extension_material_factor":    mflags.get("extension_material_factor",    1.0),
            },

            # ── labor_calculation ────────────────────────────────────────────
            "labor_calculation": {
                "productivity":          labor.get("productivity",          0.0),
                "base_days":             labor.get("base_days",             0.0),
                "adjusted_days":         labor.get("adjusted_days",         0.0),
                "complexity_multiplier": labor.get("complexity_multiplier", 1.0),
                "area_multiplier":       labor.get("area_multiplier",       1.0),
                "extension_factor":      labor.get("extension_factor",      1.0),
                "final_days":            labor.get("final_days",            0.0),
            },

            # ── multipliers_applied ──────────────────────────────────────────
            "multipliers_applied": {
                "area_multiplier":       area_mult,
                "complexity_multiplier": complexity_mult,
                "extension_factor":      extension_factor,
            },

            # ── validation_result ────────────────────────────────────────────
            "validation_result": {
                "deviation_percentage": deviation_pct,
                "confidence":           confidence,
                "flags":                state["validation_result"].get("flags", []),
            },

            # ── final_cost ───────────────────────────────────────────────────
            "final_cost": {
                "material_cost":   round(costs.get("material_cost",   0.0), 2),
                "labor_cost":      round(costs.get("labor_cost",      0.0), 2),
                "permission_cost": round(costs.get("permission_cost", 0.0), 2),
                "equipment_cost":  round(costs.get("equipment_cost",  0.0), 2),
                "total_cost":      round(costs.get("total_cost",      0.0), 2),
                "cost_per_km":     round(costs.get("cost_per_km",     0.0), 2),
            },
        }
