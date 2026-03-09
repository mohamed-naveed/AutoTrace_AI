"""
LaborAgent — Rules 6, 7, 8, 9, 10, 11, 13
"""
from typing import Dict, Any
from app.utils.helpers import get_productivity, get_complexity_multiplier, get_area_multiplier


class LaborAgent:
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        distance_m = state["derived_materials"]["distance_m"]
        build_type = state["build_type"]

        # ── Rule 6: Productivity ─────────────────────────────────────────
        productivity = get_productivity(build_type)
        # overhead → 500 m/day | underground → 250 m/day

        # ── Rule 7: BaseDays = Distance_m / Productivity ─────────────────
        base_days = distance_m / productivity if productivity > 0 else 0.0

        # ── Rule 8: AdjustedDays = BaseDays × ComplexityMultiplier ───────
        complexity_mult = get_complexity_multiplier(state["multipliers"]["complexity"])
        # low → 1.0 | medium → 1.2 | high → 1.5
        adjusted_days = base_days * complexity_mult

        # ── Rule 9: Area multiplier ───────────────────────────────────────
        area_mult = get_area_multiplier(state["multipliers"]["area"])
        # urban → 1.0 | semi-urban → 1.1 | rural → 1.2

        is_extension    = state["mode_flags"]["is_extension"]
        extension_factor = 1.0

        if is_extension:
            # ── Rule 11: Extension FinalDays = AdjustedDays × 0.6 ────────
            extension_factor = 0.6
            final_days = adjusted_days * extension_factor
        else:
            # ── Rule 10: New FinalDays = AdjustedDays × AreaMultiplier ───
            final_days = adjusted_days * area_mult

        # ── Rule 13: LaborCost = FinalDays × LaborRatePerDay ─────────────
        labor_cost = final_days * state["rates"]["labor_per_day"]

        state["derived_labor"] = {
            "productivity":          productivity,
            "base_days":             round(base_days,      4),
            "adjusted_days":         round(adjusted_days,  4),
            "final_days":            round(final_days,     4),
            "complexity_multiplier": complexity_mult,
            "area_multiplier":       area_mult,
            "extension_factor":      extension_factor,
            "confidence_score":      100.0, # Will be adjusted below
            "rationale":             "",
        }

        # ── Confidence Scoring & Rationale ───────────────────────────────
        confidence = 100.0
        rationale_lines = [
            f"Calculated base days as {round(base_days, 2)} based on distance {distance_m}m / productivity {productivity}m/day.",
            f"Applied complexity multiplier {complexity_mult} (total adjusted: {round(adjusted_days, 2)} days)."
        ]

        if is_extension:
            rationale_lines.append(f"Applied extension factor {extension_factor}. Final days: {round(final_days, 2)}.")
            confidence -= 5.0 # Slight uncertainty for extension labor
        else:
            rationale_lines.append(f"Applied area multiplier {area_mult}. Final days: {round(final_days, 2)}.")

        if complexity_mult > 1.2:
            confidence -= 10.0
            rationale_lines.append(f"High complexity region reduces labor cost confidence by 10%.")
            
        if distance_m >= 10000:
            confidence -= 15.0
            rationale_lines.append(f"Extremely long distance ({distance_m}m) reduces labor estimate confidence by 15%.")

        state["derived_labor"]["confidence_score"] = float(confidence)
        state["derived_labor"]["rationale"] = " ".join(rationale_lines)

        state["costs"]["labor_cost"] = labor_cost
        return state
