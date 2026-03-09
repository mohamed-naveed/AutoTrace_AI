"""
AggregationAgent — Rules 17, 18
"""
from typing import Dict, Any


class AggregationAgent:
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        costs = state["costs"]

        material_cost   = costs.get("material_cost",   0.0)
        labor_cost      = costs.get("labor_cost",      0.0)
        permission_cost = costs.get("permission_cost", 0.0)
        equipment_cost  = costs.get("equipment_cost",  0.0)

        # ── Rule 17: TotalCost ────────────────────────────────────────────
        total_cost = material_cost + labor_cost + permission_cost + equipment_cost

        # ── Rule 18: CostPerKM = TotalCost / Distance_km ─────────────────
        distance_km = state.get("distance_km", 0.0)
        cost_per_km = total_cost / distance_km if distance_km > 0 else 0.0

        state["costs"]["total_cost"]  = total_cost
        state["costs"]["cost_per_km"] = cost_per_km

        return state
