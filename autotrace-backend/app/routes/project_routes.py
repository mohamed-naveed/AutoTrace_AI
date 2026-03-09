from fastapi import APIRouter

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
def get_projects():
    return {"message": "Project List Configuration Pending"}
