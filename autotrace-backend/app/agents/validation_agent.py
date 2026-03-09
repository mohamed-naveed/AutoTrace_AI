"""
ValidationAgent — Rule 19
Pan-India FTTP historical baseline: ₹1,20,000/km
"""
from typing import Dict, Any
from app.utils.helpers import INDIA_HISTORICAL_AVG_PER_KM


class ValidationAgent:
    HISTORICAL_AVERAGE_PER_KM = INDIA_HISTORICAL_AVG_PER_KM  # ₹1,20,000/km

    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        cost_per_km = state["costs"].get("cost_per_km", 0.0)
        flags: list[str] = []

        deviation = 0.0
        if self.HISTORICAL_AVERAGE_PER_KM > 0:
            deviation = (
                abs(cost_per_km - self.HISTORICAL_AVERAGE_PER_KM)
                / self.HISTORICAL_AVERAGE_PER_KM
            )

        deviation_pct = round(deviation * 100, 2)

        # Base confidence from material and labor
        material_conf = state.get("derived_materials", {}).get("confidence_score", 100.0)
        labor_conf = state.get("derived_labor", {}).get("confidence_score", 100.0)
        
        # Average domain confidence
        avg_base_conf = (material_conf + labor_conf) / 2.0
        final_confidence_score = avg_base_conf

        if deviation > 0.30:
            final_confidence_score -= 20.0
            confidence = "Low"
            flags.append(
                f"Warning: Cost/km (₹{cost_per_km:,.0f}) deviates {deviation_pct:.1f}% "
                f"from India FTTP average (₹{self.HISTORICAL_AVERAGE_PER_KM:,.0f}/km). Confidence dropped by 20 points."
            )
        elif deviation > 0.15:
            final_confidence_score -= 10.0
            confidence = "Medium"
            flags.append(f"Notice: Cost/km deviates {deviation_pct:.1f}% from historical average. Confidence dropped by 10 points.")
        else:
            confidence = "High"
            
        # Final penalty if guardrails failed
        guardrail_passed = state.get("rule_engine_result", {}).get("guardrail_passed", True)
        if not guardrail_passed:
            final_confidence_score -= 30.0
            confidence = "Low"
            flags.append("Warning: Primary build guardrails failed.")

        final_confidence_score = max(0.0, final_confidence_score) # floor at 0
        requires_manual_review = final_confidence_score < 85.0 or not guardrail_passed

        # Collect rationale log from agents
        rationale_log = [
            {"agent": "Material Agent", "reasoning": state.get("derived_materials", {}).get("rationale", "")},
            {"agent": "Labor Agent", "reasoning": state.get("derived_labor", {}).get("rationale", "")},
            {"agent": "Rule Engine", "reasoning": state.get("rule_engine_result", {}).get("rationale", "")},
            {"agent": "Validation Agent", "reasoning": " ".join(flags) if flags else "Validation passed against historical averages."}
        ]

        state["validation_result"] = {
            "deviation_percentage":   deviation_pct,
            "confidence":             confidence,
            "confidence_score":       round(final_confidence_score, 2),
            "requires_manual_review": requires_manual_review,
            "validation_flag":        requires_manual_review,
            "flags":                  flags,
            "rationale_log":          rationale_log
        }
        return state
