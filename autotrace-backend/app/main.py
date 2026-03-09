from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import estimate_routes, replay_routes

app = FastAPI(
    title="AutoTrace AI API",
    description="Intelligent FTTP cost estimation and governance system",
    version="1.0.0"
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Optional placeholder root check
@app.get("/")
def read_root():
    return {"message": "Welcome to AutoTrace AI"}

# Mount API routers
app.include_router(estimate_routes.router, prefix="/api/v1")
app.include_router(replay_routes.router, prefix="/api/v1")
