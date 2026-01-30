"""
File-based program blueprint storage.
Each program is stored as data/programs/{profile_id}/{program_id}.json.
"""
from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

API_ROOT = Path(__file__).resolve().parent
PROGRAMS_DIR = Path(os.environ.get("LIFE_ONE_PROGRAMS_DIR", str(API_ROOT / "data" / "programs")))


def _programs_dir_for(profile_id: str) -> Path:
    d = PROGRAMS_DIR if isinstance(PROGRAMS_DIR, Path) else Path(PROGRAMS_DIR)
    return d / profile_id


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def list_programs(profile_id: str) -> list[dict]:
    """Return all program blueprints for the profile. Order by filename (id)."""
    base = _programs_dir_for(profile_id)
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


def get_program(profile_id: str, program_id: str) -> dict | None:
    """Load a single program blueprint. Returns None if missing or invalid."""
    path = _programs_dir_for(profile_id) / f"{program_id}.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "id" not in data or "name" not in data or "sections" not in data:
            return None
        return data
    except (json.JSONDecodeError, OSError):
        return None


def save_program(profile_id: str, blueprint: dict) -> None:
    """Overwrite blueprint file. Id must match filename."""
    pid = blueprint.get("id")
    if not pid:
        raise ValueError("blueprint must have id")
    base = _programs_dir_for(profile_id)
    _ensure_dir(base)
    path = base / f"{pid}.json"
    raw = json.dumps(blueprint, indent=2, ensure_ascii=False)
    path.write_text(raw, encoding="utf-8")


def delete_program(profile_id: str, program_id: str) -> bool:
    """Remove blueprint file. Returns True if deleted, False if not found."""
    path = _programs_dir_for(profile_id) / f"{program_id}.json"
    if not path.exists():
        return False
    path.unlink()
    return True


def create_empty_blueprint(name: str) -> dict:
    """Blueprint with id, name, sections only."""
    return {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "sections": [],
    }
