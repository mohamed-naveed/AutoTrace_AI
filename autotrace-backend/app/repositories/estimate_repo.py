from typing import List, Optional
from app.database import cost_estimates_collection


class EstimateRepository:
    """CRUD against the `cost_estimates` collection."""

    async def save(self, data: dict) -> dict:
        result = await cost_estimates_collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def get_by_project(self, project_id: str) -> Optional[dict]:
        doc = await cost_estimates_collection.find_one({"project_id": project_id})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def list_all(self, limit: int = 100) -> List[dict]:
        cursor = cost_estimates_collection.find().sort("created_at", -1).limit(limit)
        docs   = await cursor.to_list(length=limit)
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    async def delete_by_project(self, project_id: str) -> bool:
        result = await cost_estimates_collection.delete_many({"project_id": project_id})
        return result.deleted_count > 0

    async def update_by_project(self, project_id: str, data: dict) -> bool:
        update_data = {k: v for k, v in data.items() if k != "_id"}
        result = await cost_estimates_collection.update_one(
            {"project_id": project_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
