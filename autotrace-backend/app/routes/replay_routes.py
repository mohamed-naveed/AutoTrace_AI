from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.estimate_service import EstimateService
from app.agents.replay_agent import ReplayAgent

router = APIRouter(prefix="/replay", tags=["Replay Analysis"])

estimate_service = EstimateService()
replay_agent = ReplayAgent()

@router.post("/{project_id}")
async def run_dna_replay(project_id: str, overrides: Dict[str, Any]):
    """
    Fetch the existing Cost DNA for a project, apply the overrides, 
    and run a new theoretical estimate for comparison.
    """
    # 1. Fetch the existing DNA record from the database
    past_dna = await estimate_service.dna_repo.get_by_project(project_id)
    if not past_dna:
        # Fallback: Try to reconstruct minimal DNA from project metadata
        past_dna = await estimate_service.reconstruct_minimal_dna(project_id)
        if not past_dna:
            raise HTTPException(status_code=404, detail="Project not found and DNA cannot be reconstructed")
        
    # 2. Run the Replay Agent
    try:
        replay_result = replay_agent.process(past_dna, overrides)
        return {"status": "success", "data": replay_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Replay failed: {str(e)}")

@router.post("/{project_id}/save")
async def save_dna_replay(project_id: str, simulated_dna: Dict[str, Any]):
    """
    Overwrites the official project records with the simulated results.
    """
    try:
        success = await estimate_service.update_project_with_simulated_dna(project_id, simulated_dna)
        return {"status": "success", "message": "Project updated with simulated results"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")
