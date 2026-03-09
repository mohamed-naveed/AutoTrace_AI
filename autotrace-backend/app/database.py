import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
db = client[settings.database_name]

# Collections
projects_collection = db["projects"]
cost_estimates_collection = db["cost_estimates"]
cost_dna_collection = db["cost_dna"]
