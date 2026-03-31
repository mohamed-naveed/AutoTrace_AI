"""
EstimateService — orchestrates the full AI agent pipeline and persists results
to all three MongoDB collections:

  1. projects       → one document per project
  2. cost_estimates → flattened cost breakdown
  3. cost_dna       → full traceable audit record
"""
from typing import Dict, Any
from datetime import datetime
import uuid

from app.models.input_model import EstimateInput

from app.agents.input_agent        import InputAgent
from app.agents.project_mode_agent import ProjectModeAgent
from app.agents.material_agent     import MaterialAgent
from app.agents.labor_agent        import LaborAgent
from app.agents.rule_engine_agent  import RuleEngineAgent
from app.agents.overhead_agent     import OverheadAgent
from app.agents.aggregation_agent  import AggregationAgent
from app.agents.validation_agent   import ValidationAgent
from app.agents.dna_agent          import DNAAgent
from app.agents.explanation_agent  import ExplanationAgent
from app.agents.ai_prediction_agent import AIPredictionAgent

from app.repositories.project_repo  import ProjectRepository
from app.repositories.estimate_repo import EstimateRepository
from app.repositories.dna_repo      import DNARepository


class EstimateService:
    def __init__(self):
        # Agents
        self.input_agent        = InputAgent()
        self.project_mode_agent = ProjectModeAgent()
        self.material_agent     = MaterialAgent()
        self.labor_agent        = LaborAgent()
        self.rule_engine_agent  = RuleEngineAgent()
        self.overhead_agent     = OverheadAgent()
        self.aggregation_agent  = AggregationAgent()
        self.validation_agent   = ValidationAgent()
        self.dna_agent          = DNAAgent()
        self.explanation_agent  = ExplanationAgent()
        self.ai_prediction_agent= AIPredictionAgent()

        # Repositories
        self.project_repo  = ProjectRepository()
        self.estimate_repo = EstimateRepository()
        self.dna_repo      = DNARepository()

    async def reconstruct_minimal_dna(self, project_id: str) -> Dict[str, Any]:
        """
        Builds a basic DNA structure from project metadata if the record is missing.
        """
        proj = await self.project_repo.get_by_id(project_id)
        if not proj:
            return None
            
        return {
            "project_id": project_id,
            "inputs": {
                "project_name":        proj.get("project_name", "Recovered"),
                "project_type":        proj.get("project_type", "new"),
                "area_type":           proj.get("area_type", "urban"),
                "build_type":          proj.get("build_type", "overhead"),
                "distance_km":         proj.get("distance_km", 0.0),
                "distance_m":          proj.get("distance_m", 0.0),
                "state":               proj.get("state", ""),
                "location":            proj.get("location", ""),
                "complexity":          proj.get("complexity", "low"),
                "permission_required": proj.get("permission_required", False),
                "equipment_required":  proj.get("equipment_required", False),
                "cable_rate":             proj.get("cable_rate", 45.0),
                "pole_rate":              proj.get("pole_rate", 3000.0),
                "duct_rate":              proj.get("duct_rate", 500.0),
                "joint_box_rate":         proj.get("joint_box_rate", 1500.0),
                "labor_rate_per_day":     proj.get("labor_rate_per_day", 1200.0),
                "equipment_rate_per_day": proj.get("equipment_rate_per_day", 0.0),
            },
            "final_cost": {
                "material_cost":   0.0,
                "labor_cost":      0.0,
                "permission_cost": 0.0,
                "equipment_cost":  0.0,
                "total_cost":      0.0,
                "cost_per_km":     0.0,
            },
            "timestamp": datetime.utcnow().isoformat(),
            "status": "reconstructed"
        }

    async def update_project_with_simulated_dna(self, project_id: str, new_dna: Dict[str, Any]) -> bool:
        """
        Overwrites the existing project, estimate, and DNA records 
        with the values from a simulated (What-If) DNA.
        """
        # 1. Update Project Metadata
        inputs = new_dna.get("inputs", {})
        distance_km = inputs.get("distance_km", 0.0)
        
        project_update = {
            "distance_m":          distance_km * 1000.0,
            "distance_km":         distance_km,
            "area_type":           inputs.get("area_type"),
            "build_type":          inputs.get("build_type"),
            "complexity":          inputs.get("complexity"),
            "permission_required": inputs.get("permission_required"),
            "equipment_required":  inputs.get("equipment_required"),
            "cable_rate":             inputs.get("cable_rate"),
            "pole_rate":              inputs.get("pole_rate"),
            "duct_rate":              inputs.get("duct_rate"),
            "joint_box_rate":         inputs.get("joint_box_rate"),
            "labor_rate_per_day":     inputs.get("labor_rate_per_day"),
            "equipment_rate_per_day": inputs.get("equipment_rate_per_day"),
            "updated_at":          datetime.utcnow().isoformat()
        }
        await self.project_repo.update(project_id, project_update)

        # 2. Update Cost Estimate
        costs = new_dna.get("final_cost", {})
        estimate_update = {
            "material_cost":    costs.get("material_cost", 0.0),
            "labor_cost":       costs.get("labor_cost", 0.0),
            "permission_cost":  costs.get("permission_cost", 0.0),
            "equipment_cost":   costs.get("equipment_cost", 0.0),
            "total_cost":       costs.get("total_cost", 0.0),
            "cost_per_km":      costs.get("cost_per_km", 0.0),
            "updated_at":       datetime.utcnow().isoformat(),
        }
        await self.estimate_repo.update_by_project(project_id, estimate_update)

        # 3. Update DNA
        # We replace the whole DNA but ensure it stays linked to the correct project_id
        new_dna["project_id"] = project_id
        new_dna["updated_at"] = datetime.utcnow().isoformat()
        await self.dna_repo.update_by_project(project_id, new_dna)

        return True

    async def generate_and_save(self, request: EstimateInput) -> Dict[str, Any]:
        """Run the full pipeline, persist to MongoDB, return the DNA document."""
        payload = request.model_dump()

        # ── 1. Agent Pipeline ────────────────────────────────────────────
        state = self.input_agent.process(payload)
        state = self.project_mode_agent.process(state)
        state = self.material_agent.process(state)
        state = self.labor_agent.process(state)
        state = self.overhead_agent.process(state)
        state = self.aggregation_agent.process(state)
        state = self.rule_engine_agent.process(state)
        state = self.ai_prediction_agent.run(state)
        state = self.validation_agent.process(state)
        dna   = self.dna_agent.process(state)

        try:
            explanation = self.explanation_agent.process(dna)
            dna["explanation"] = explanation
        except Exception:
            dna["explanation"] = ""

        project_id = state["project_id"]

        # ── 2. Save to `projects` collection ────────────────────────────
        # Rule 1: store distance_m = distance_km × 1000 in the DB
        distance_km = payload.get("distance_km", 0.0)
        project_doc = {
            "project_id":          project_id,
            "project_name":        payload.get("project_name", "Unnamed"),
            "project_type":        payload.get("project_type"),
            "area_type":           payload.get("area_type"),
            "build_type":          payload.get("build_type"),
            "distance_m":          distance_km * 1000.0,
            "distance_km":         distance_km,
            "state":               payload.get("state", ""),
            "location":            payload.get("location", ""),
            "complexity":          payload.get("complexity", "medium"),
            "permission_required": payload.get("permission_required", False),
            "equipment_required":  payload.get("equipment_required", False),
            "cable_rate":             payload.get("cable_rate", 45.0),
            "pole_rate":              payload.get("pole_rate", 3000.0),
            "duct_rate":              payload.get("duct_rate", 500.0),
            "joint_box_rate":         payload.get("joint_box_rate", 1500.0),
            "labor_rate_per_day":     payload.get("labor_rate_per_day", 1200.0),
            "equipment_rate_per_day": payload.get("equipment_rate_per_day", 0.0),
            "created_by":          payload.get("created_by", "System"),
            "priority":            payload.get("priority", "medium"),
            "created_at":          datetime.utcnow().isoformat(),
        }
        await self.project_repo.create(project_doc)

        # ── 3. Save to `cost_estimates` collection ───────────────────────
        costs = state["costs"]
        validation = state["validation_result"]
        confidence_level = validation.get("confidence", "High")
        confidence_score = validation.get("confidence_score", 100.0)
        requires_manual_review = validation.get("requires_manual_review", False)
        validation_flag  = validation.get("validation_flag", False)
        rationale_log = validation.get("rationale_log", [])
        prediction_difference = state.get("prediction_difference", 0.0)
        ai_predicted_cost = state.get("ai_predicted_cost", 0.0)

        estimate_doc = {
            "project_id":       project_id,
            "material_cost":    round(costs.get("material_cost", 0.0), 2),
            "labor_cost":       round(costs.get("labor_cost", 0.0), 2),
            "permission_cost":  round(costs.get("permission_cost", 0.0), 2),
            "equipment_cost":   round(costs.get("equipment_cost", 0.0), 2),
            "total_cost":       round(costs.get("total_cost", 0.0), 2),
            "confidence_level": confidence_level,
            "confidence_score": confidence_score,
            "requires_manual_review": requires_manual_review,
            "validation_flag":  validation_flag,
            "rationale_log":    rationale_log,
            "prediction_difference": prediction_difference,
            "ai_predicted_cost": ai_predicted_cost,
            "cost_per_km":      round(costs.get("cost_per_km", 0.0), 2),
            "created_at":       datetime.utcnow().isoformat(),
        }
        await self.estimate_repo.save(estimate_doc)

        # ── 4. Save to `cost_dna` collection ────────────────────────────
        await self.dna_repo.save(dna)

        return dna

    # Backwards-compatible sync stub (used by tests / old routes)
    def generate_estimate(self, request: EstimateInput) -> Dict[str, Any]:
        """Sync version — runs pipeline only, no DB persistence."""
        state = self.input_agent.process(request.model_dump())
        state = self.project_mode_agent.process(state)
        state = self.material_agent.process(state)
        state = self.labor_agent.process(state)
        state = self.overhead_agent.process(state)
        state = self.aggregation_agent.process(state)
        state = self.rule_engine_agent.process(state)
        state = self.ai_prediction_agent.run(state)
        state = self.validation_agent.process(state)
        dna   = self.dna_agent.process(state)
        return dna

    async def delete_project(self, project_id: str) -> bool:
        """Deletes a project and its associated estimates and DNA from the database."""
        deleted_project = await self.project_repo.delete(project_id)
        if deleted_project:
            await self.estimate_repo.delete_by_project(project_id)
            await self.dna_repo.delete_by_project(project_id)
        return deleted_project
