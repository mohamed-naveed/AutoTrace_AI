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

        # Repositories
        self.project_repo  = ProjectRepository()
        self.estimate_repo = EstimateRepository()
        self.dna_repo      = DNARepository()

    async def generate_and_save(self, request: EstimateInput) -> Dict[str, Any]:
        """Run the full pipeline, persist to MongoDB, return the DNA document."""
        payload = request.model_dump()

        # ── 1. Agent Pipeline ────────────────────────────────────────────
        state = self.input_agent.process(payload)
        state = self.project_mode_agent.process(state)
        state = self.material_agent.process(state)
        state = self.labor_agent.process(state)
        state = self.rule_engine_agent.process(state)
        state = self.overhead_agent.process(state)
        state = self.aggregation_agent.process(state)
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
            "complexity":          payload.get("complexity"),
            "permission_required": payload.get("permission_required", False),
            "equipment_required":  payload.get("equipment_required", False),
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
        state = self.rule_engine_agent.process(state)
        state = self.overhead_agent.process(state)
        state = self.aggregation_agent.process(state)
        state = self.validation_agent.process(state)
        dna   = self.dna_agent.process(state)
        return dna
