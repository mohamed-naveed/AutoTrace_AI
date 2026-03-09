"""
MaterialAgent — Rules 2, 3, 4, 5, 12, 14

Extension scenario:
  - FTTP already exists at the premises.
  - Only the NEW additional cable run needs material.
  - Poles/ducts/joint-boxes still needed for the extension segment.
  - Underground uplift (×1.30) is NOT applied  (existing duct may be reused).
  - Material cost is reduced by 30% to account for reuse of existing
    infrastructure (splice points, cabinets, ONUs already in place).
"""
from typing import Dict, Any


EXTENSION_MATERIAL_REDUCTION = 0.70   # pay only ~70% of full material cost


class MaterialAgent:
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        distance_m  = state["distance_m"]
        build_type  = state["build_type"].lower()
        is_new      = state["mode_flags"]["is_new_deployment"]
        is_ext      = state["mode_flags"]["is_extension"]

        # ── Rule 2: CableLength = Distance_m × 1.05 ─────────────────────
        cable_length = distance_m * 1.05

        # ── Rule 3 / 4: Poles (overhead) or Duct sections (underground) ──
        poles         = 0.0
        duct_sections = 0.0

        if build_type == "overhead":
            poles = distance_m / 50           # Rule 3: one pole per 50 m
        elif build_type == "underground":
            duct_sections = distance_m / 100  # Rule 4: one duct per 100 m

        # ── Rule 5: JointBoxes = Distance_m / 500 ────────────────────────
        joint_boxes = distance_m / 500

        # ── Rule 12: MaterialCost formula ────────────────────────────────
        rates = state["rates"]
        material_cost = (
            (cable_length  * rates["cable"])    +
            (poles         * rates["pole"])     +
            (duct_sections * rates["duct"])     +
            (joint_boxes   * rates["joint_box"])
        )

        # ── Rule 14: Underground uplift × 1.30 (NEW deployment only) ─────
        underground_uplift_applied = False
        if build_type == "underground" and is_new:
            material_cost *= 1.30
            underground_uplift_applied = True

        # ── Extension reduction: 30% material saving ─────────────────────
        # Existing home already has: ONU, indoor wiring, wall entry point,
        # splice box, and (partially) existing duct/pole infrastructure.
        # Only the incremental cable run to the new point is costed in full;
        # shared infrastructure is discounted.
        extension_reduction_applied = False
        if is_ext:
            material_cost *= EXTENSION_MATERIAL_REDUCTION
            extension_reduction_applied = True

        state["derived_materials"] = {
            "distance_m":    distance_m,
            "cable_length":  round(cable_length,  4),
            "poles":         round(poles,          4),
            "duct_sections": round(duct_sections,  4),
            "joint_boxes":   round(joint_boxes,    4),
            "confidence_score": 100.0,
            "rationale": "",
        }
        
        # ── Confidence Scoring & Rationale ───────────────────────────────
        confidence = 100.0
        rationale_lines = [
            f"Calculated cable length as {round(cable_length, 2)}m (5% wastage).",
        ]
        
        if build_type == "overhead":
            rationale_lines.append(f"Calculated {round(poles, 2)} overhead poles required.")
        elif build_type == "underground":
            rationale_lines.append(f"Calculated {round(duct_sections, 2)} underground duct sections required.")
            
        rationale_lines.append(f"Calculated {round(joint_boxes, 2)} joint boxes required.")

        if underground_uplift_applied:
            rationale_lines.append("Applied 30% material cost uplift for NEW underground build.")
            confidence -= 5.0 # Higher variance in underground digging
            
        if extension_reduction_applied:
            rationale_lines.append(f"Applied {int((1 - EXTENSION_MATERIAL_REDUCTION)*100)}% material cost discount for extension infrastructure reuse.")
            confidence -= 10.0 # Reusing infrastructure carries estimation uncertainty

        state["derived_materials"]["confidence_score"] = float(confidence)
        state["derived_materials"]["rationale"] = " ".join(rationale_lines)

        state["material_flags"] = {
            "underground_uplift_applied": underground_uplift_applied,
            "extension_reduction_applied": extension_reduction_applied,
            "extension_material_factor":  EXTENSION_MATERIAL_REDUCTION if is_ext else 1.0,
        }

        state["costs"]["material_cost"] = material_cost
        return state
