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


@router.get("/dna", summary="List all Cost DNA records")
async def list_dna():
    records = await estimate_service.dna_repo.list_all()
    return {"status": "success", "data": records}


@router.get("/{project_id}/dna", summary="Get Cost DNA for a project")
async def get_dna(project_id: str):
    record = await estimate_service.dna_repo.get_by_project(project_id)
    if not record:
        raise HTTPException(status_code=404, detail="DNA record not found")
    return {"status": "success", "data": record}
