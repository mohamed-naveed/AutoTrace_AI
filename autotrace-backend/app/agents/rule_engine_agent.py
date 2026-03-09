from typing import Dict, Any

class RuleEngineAgent:
    """Verifies and ensures rules were correctly structured or applies dynamic pricing modifiers."""
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        rationale_lines = []
        guardrail_passed = True
        
        # Guardrail 1: Project must have a non-zero distance.
        if state.get("distance_m", 0) <= 0:
            guardrail_passed = False
            rationale_lines.append("Guardrail Failed: Project distance is zero or missing.")
            
        # Guardrail 2: Base materials must be > 0.
        material_cost = state.get("costs", {}).get("material_cost", 0.0)
        if material_cost <= 0:
            guardrail_passed = False
            rationale_lines.append("Guardrail Failed: Calculated material cost is zero or negative.")

        if guardrail_passed:
            rationale_lines.append("All core estimation guardrails passed successfully.")

        state["rule_engine_result"] = {
            "guardrail_passed": guardrail_passed,
            "rationale": " ".join(rationale_lines)
        }
        return state
