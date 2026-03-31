"""
ValidationAgent — Rule 19
Pan-India FTTP historical baseline: ₹1,20,000/km
"""
from typing import Dict, Any
from app.utils.helpers import INDIA_HISTORICAL_AVG_PER_KM


class ValidationAgent:
    HISTORICAL_AVERAGE_PER_KM = INDIA_HISTORICAL_AVG_PER_KM  # ₹1,20,000/km

    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        rule_cost = state["costs"].get("total_cost", 0.0)
        ai_cost = state.get("ai_predicted_cost", 0.0)
        flags: list[str] = []

        deviation = 0.0
        if ai_cost > 0:
            deviation = abs(rule_cost - ai_cost) / ai_cost

        deviation_pct = round(deviation * 100, 2)
        state["prediction_difference"] = deviation

        # Base confidence from material and labor
        material_conf = state.get("derived_materials", {}).get("confidence_score", 100.0)
        labor_conf = state.get("derived_labor", {}).get("confidence_score", 100.0)
        
        # Average domain confidence
        avg_base_conf = (material_conf + labor_conf) / 2.0
        final_confidence_score = avg_base_conf

        if deviation < 0.1:
            confidence = "High"
        elif deviation < 0.25:
            final_confidence_score -= 10.0
            confidence = "Medium"
            flags.append(f"Notice: Rule cost deviates {deviation_pct:.1f}% from AI prediction. Confidence dropped by 10 points.")
        else:
            final_confidence_score -= 20.0
            confidence = "Low"
            flags.append(
                f"Warning: Rule cost (₹{rule_cost:,.0f}) deviates {deviation_pct:.1f}% "
                f"from AI prediction (₹{ai_cost:,.0f}). Confidence dropped by 20 points."
            )
            
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
            {"agent": "Validation Agent", "reasoning": " ".join(flags) if flags else "Validation passed against AI Prediction."}
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
