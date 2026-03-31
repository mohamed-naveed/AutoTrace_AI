from fastapi import APIRouter, HTTPException
from app.models.input_model import EstimateInput
from app.services.estimate_service import EstimateService

router = APIRouter(prefix="/estimates", tags=["Estimates"])
estimate_service = EstimateService()


@router.post("/", summary="Run pipeline & save to all 3 collections")
async def create_estimate(request: EstimateInput):
    """
    Accepts project parameters, runs the full AI agent pipeline,
    persists to `projects`, `cost_estimates`, and `cost_dna`,
    then returns the Cost DNA document.
    """
    try:
        dna = await estimate_service.generate_and_save(request)
        return {"status": "success", "data": dna}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", summary="List all cost estimates")
async def list_estimates():
    estimates = await estimate_service.estimate_repo.list_all()
    return {"status": "success", "data": estimates}


@router.get("/projects", summary="List all projects")
async def list_projects():
    projects = await estimate_service.project_repo.list_all()
    return {"status": "success", "data": projects}


@router.get("/projects/{project_id}", summary="Get a single project")
async def get_project(project_id: str):
    project = await estimate_service.project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "data": project}


@router.get("/dna", summary="List all Cost DNA records")
async def list_dna():
    records = await estimate_service.dna_repo.list_all()
    return {"status": "success", "data": records}


@router.get("/{project_id}/dna", summary="Get Cost DNA for a project")
async def get_dna(project_id: str):
    # 1. Fetch DNA from DB
    record = await estimate_service.dna_repo.get_by_project(project_id)
    if not record:
        # Fallback: Create minimal DNA from project metadata
        record = await estimate_service.reconstruct_minimal_dna(project_id)
        if not record:
            raise HTTPException(status_code=404, detail="DNA record not found and cannot be reconstructed")
    return {"status": "success", "data": record}

@router.delete("/{project_id}", summary="Delete a project and its associated data")
async def delete_project(project_id: str):
    success = await estimate_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "message": "Project deleted successfully"}
