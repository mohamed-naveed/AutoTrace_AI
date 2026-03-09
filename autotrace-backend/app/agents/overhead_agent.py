"""
OverheadAgent — Rules 15, 16
"""
from typing import Dict, Any


class OverheadAgent:
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        material_cost = state["costs"]["material_cost"]
        labor_cost    = state["costs"]["labor_cost"]
        final_days    = state["derived_labor"]["final_days"]
        flags         = state["flags"]

        # ── Rule 15: PermissionCost = 5% of (Material + Labor) ───────────
        permission_cost = 0.0
        if flags.get("permission_required"):
            permission_cost = 0.05 * (material_cost + labor_cost)

        # ── Rule 16: EquipmentCost = Rate × FinalDays ─────────────────────
        equipment_cost = 0.0
        if flags.get("equipment_required"):
            equipment_cost = state["rates"]["equipment_per_day"] * final_days

        state["derived_overhead"] = {
            "permission_cost": round(permission_cost, 2),
            "equipment_cost":  round(equipment_cost,  2),
        }

        state["costs"]["permission_cost"] = permission_cost
        state["costs"]["equipment_cost"]  = equipment_cost

        return state
