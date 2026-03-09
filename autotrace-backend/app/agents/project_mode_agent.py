from typing import Dict, Any


class ProjectModeAgent:
    """Detects 'new' or 'extension' project type and sets operational flags."""

    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_type = state.get("project_type", "new").lower()
        is_extension = (project_type == "extension")

        state["mode_flags"] = {
            "is_extension":       is_extension,
            "is_new_deployment":  not is_extension,
        }

        # Pre-populate multipliers dict for downstream agents
        state["multipliers"] = {
            "complexity": state.get("complexity", "low"),
            "area":       state.get("area_type", "urban"),
        }

        return state
