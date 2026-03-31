from typing import Dict, Any
from app.models.input_model import EstimateInput
from app.services.estimate_service import EstimateService

class ReplayAgent:
    """
    Takes previous `CostDNA` inputs, merges them with new overrides, 
    and re-runs the estimation pipeline to generate a new cost estimate 
    for comparison purposes (What-if analysis).
    """
    def __init__(self):
        # We need an instance of the service to run the pipeline
        self.estimate_service = EstimateService()
        
    def process(self, past_dna: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge past inputs with any new overrides and run a new estimate.
        Returns the new DNA and the old DNA for comparison.
        """
        # 1. Extract the old inputs from the past DNA record
        old_inputs = past_dna.get("inputs", {})
        
        # 2. Merge old inputs with new overrides
        # New overrides take precedence
        merged_inputs = {**old_inputs, **overrides}
        
        # Legacy fallback: If the old DB record was saved before `project_name` was required
        if "project_name" not in merged_inputs:
            merged_inputs["project_name"] = f"Replay of {past_dna.get('project_id', 'Unknown')}"
            
        
        # Create a new EstimateInput model from the merged dictionary
        # This acts as validation to ensure we have all required fields
        new_request = EstimateInput(**merged_inputs)
        
        # 3. Run the estimation pipeline synchronously (we don't persist replay results yet)
        # Using the sync stub function in the service to just get the DNA
        new_dna = self.estimate_service.generate_estimate(new_request)

        # 4. Apply Inflation Scaling (What-If Pro logic)
        labor_inflation = float(overrides.get("labor_inflation", 0))
        material_inflation = float(overrides.get("material_inflation", 0))

        if labor_inflation != 0:
            original_labor = new_dna["final_cost"]["labor_cost"]
            new_dna["final_cost"]["labor_cost"] = round(original_labor * (1 + labor_inflation / 100), 2)
        
        if material_inflation != 0:
            original_material = new_dna["final_cost"]["material_cost"]
            new_dna["final_cost"]["material_cost"] = round(original_material * (1 + material_inflation / 100), 2)

        # Recalculate Total Cost
        new_dna["final_cost"]["total_cost"] = round(
            new_dna["final_cost"]["material_cost"] + 
            new_dna["final_cost"]["labor_cost"] + 
            new_dna["final_cost"]["permission_cost"] + 
            new_dna["final_cost"]["equipment_cost"], 
            2
        )

        # 5. Return both for the frontend to compare
        return {
            "old_dna": past_dna,
            "new_dna": new_dna,
            "overrides_applied": overrides
        }
