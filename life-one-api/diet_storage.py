"""
File-based diet blueprint storage.
Each diet is stored as data/diets/{profile_id}/{diet_id}.json.
"""
from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

API_ROOT = Path(__file__).resolve().parent
DIETS_DIR = Path(os.environ.get("LIFE_ONE_DIETS_DIR", str(API_ROOT / "data" / "diets")))


def _diets_dir_for(profile_id: str) -> Path:
    d = DIETS_DIR if isinstance(DIETS_DIR, Path) else Path(DIETS_DIR)
    return d / profile_id


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def list_diets(profile_id: str) -> list[dict]:
    """Return all diet blueprints for the profile. Order by filename (id)."""
    base = _diets_dir_for(profile_id)
    if not base.exists():
        return []
    out = []
    for p in sorted(base.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(data, dict) and "id" in data and "name" in data and "sections" in data:
                out.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return out


def get_diet(profile_id: str, diet_id: str) -> dict | None:
    """Load a single diet blueprint. Returns None if missing or invalid."""
    path = _diets_dir_for(profile_id) / f"{diet_id}.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "id" not in data or "name" not in data or "sections" not in data:
            return None
        return data
    except (json.JSONDecodeError, OSError):
        return None


def save_diet(profile_id: str, blueprint: dict) -> None:
    """Overwrite blueprint file. Id must match filename."""
    did = blueprint.get("id")
    if not did:
        raise ValueError("blueprint must have id")
    base = _diets_dir_for(profile_id)
    _ensure_dir(base)
    path = base / f"{did}.json"
    raw = json.dumps(blueprint, indent=2, ensure_ascii=False)
    path.write_text(raw, encoding="utf-8")


def delete_diet(profile_id: str, diet_id: str) -> bool:
    """Remove blueprint file. Returns True if deleted, False if not found."""
    path = _diets_dir_for(profile_id) / f"{diet_id}.json"
    if not path.exists():
        return False
    path.unlink()
    return True


def create_empty_blueprint(name: str) -> dict:
    """Blueprint with id, name, sections only (sections have foodNames)."""
    return {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "sections": [],
    }
