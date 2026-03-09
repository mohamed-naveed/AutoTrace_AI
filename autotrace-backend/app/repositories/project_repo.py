from typing import List, Optional
from datetime import datetime
from app.database import projects_collection


class ProjectRepository:
    """CRUD against the `projects` collection."""

    async def create(self, data: dict) -> dict:
        data.setdefault("created_at", datetime.utcnow().isoformat())
        result = await projects_collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def get_by_id(self, project_id: str) -> Optional[dict]:
        doc = await projects_collection.find_one({"project_id": project_id})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def list_all(self, limit: int = 100) -> List[dict]:
        cursor = projects_collection.find().sort("created_at", -1).limit(limit)
        docs   = await cursor.to_list(length=limit)
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs
