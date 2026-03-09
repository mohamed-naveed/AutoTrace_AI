from fastapi import FastAPI
from app.routes import estimate_routes, replay_routes

app = FastAPI(
    title="AutoTrace AI API",
    description="Intelligent FTTP cost estimation and governance system",
    version="1.0.0"
)

# Optional placeholder root check
@app.get("/")
def read_root():
    return {"message": "Welcome to AutoTrace AI"}

# Mount API routers
app.include_router(estimate_routes.router, prefix="/api/v1")
app.include_router(replay_routes.router, prefix="/api/v1")
