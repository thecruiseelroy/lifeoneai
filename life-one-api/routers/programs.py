"""
Programs and sections: file-based blueprint storage per profile.
Each program is data/programs/{profile_id}/{program_id}.json.
API shape unchanged: id, name, sections: [{ id, name, description, days, exerciseNames }].
"""
from __future__ import annotations

import json
import uuid
from fastapi import APIRouter, Depends, HTTPException

from database import get_connection
import program_storage as storage
from routers.auth import require_profile_match

router = APIRouter(tags=["programs"])


def _normalize_blueprint(b: dict) -> dict:
    """Ensure blueprint has id, name, sections; sections have exerciseNames."""
    sections = []
    for s in (b.get("sections") or []):
        if not isinstance(s, dict):
            continue
        sections.append({
            "id": s.get("id") or str(uuid.uuid4()),
            "name": (s.get("name") or "").strip(),
            "description": (s.get("description") or "").strip(),
            "days": s.get("days") if isinstance(s.get("days"), list) else [],
            "exerciseNames": [x for x in (s.get("exerciseNames") or s.get("exercise_names") or []) if isinstance(x, str) and x.strip()],
        })
    out = {
        "id": (b.get("id") or "").strip() or str(uuid.uuid4()),
        "name": (b.get("name") or "").strip(),
        "sections": sections,
    }
    if "meta" in b and isinstance(b["meta"], dict):
        out["meta"] = b["meta"]
    return out


def _to_response(b: dict) -> dict:
    """Blueprint -> API response (sections with exerciseNames)."""
    return {
        "id": b["id"],
        "name": b["name"],
        "sections": [
            {
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "days": s["days"],
                "exerciseNames": s["exerciseNames"],
            }
            for s in b["sections"]
        ],
    }


@router.get("/api/profiles/{profile_name}/programs")
def list_programs(profile_name: str, profile_id: str = Depends(require_profile_match)):
    blueprints = storage.list_programs(profile_id)
    return [_to_response(b) for b in blueprints]


@router.get("/api/profiles/{profile_name}/programs/{program_id}")
def get_program(profile_name: str, program_id: str, profile_id: str = Depends(require_profile_match)):
    b = storage.get_program(profile_id, program_id)
    if not b:
        raise HTTPException(status_code=404, detail="Program not found")
    return _to_response(_normalize_blueprint(b))


@router.post("/api/profiles/{profile_name}/programs")
def create_program(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    blueprint = storage.create_empty_blueprint(name)
    storage.save_program(profile_id, blueprint)
    return _to_response(blueprint)


@router.post("/api/profiles/{profile_name}/programs/import")
def import_program(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    """Import a full program blueprint (e.g. AI-generated). Body = { id, name, sections, meta? }."""
    blueprint = _normalize_blueprint(body)
    if not blueprint["name"]:
        raise HTTPException(status_code=400, detail="name is required")
    storage.save_program(profile_id, blueprint)
    return _to_response(blueprint)


@router.put("/api/profiles/{profile_name}/programs/{program_id}")
def update_program(profile_name: str, program_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
    b = storage.get_program(profile_id, program_id)
    if not b:
        raise HTTPException(status_code=404, detail="Program not found")
    b = _normalize_blueprint(b)
    name = (body.get("name") or "").strip()
    if name:
        b["name"] = name
    storage.save_program(profile_id, b)
    return _to_response(b)


@router.delete("/api/profiles/{profile_name}/programs/{program_id}")
def delete_program(profile_name: str, program_id: str, profile_id: str = Depends(require_profile_match)):
    if not storage.delete_program(profile_id, program_id):
        raise HTTPException(status_code=404, detail="Program not found")
    return {"ok": True}


def _load_mutate_save(profile_id: str, program_id: str, mutate):
    b = storage.get_program(profile_id, program_id)
    if not b:
        raise HTTPException(status_code=404, detail="Program not found")
    b = _normalize_blueprint(b)
    mutate(b)
    storage.save_program(profile_id, b)
    return _to_response(b)


@router.post("/api/profiles/{profile_name}/programs/{program_id}/sections")
def add_section(profile_name: str, program_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
    section_id = str(uuid.uuid4())
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()
    days = body.get("days")
    if not isinstance(days, list):
        days = []
    new_section = {
        "id": section_id,
        "name": name,
        "description": description,
        "days": days,
        "exerciseNames": [],
    }

    def add(b):
        b["sections"] = b["sections"] + [new_section]

    return _load_mutate_save(profile_id, program_id, add)


@router.put("/api/profiles/{profile_name}/programs/{program_id}/sections/{section_id}")
def update_section(profile_name: str, program_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)):

    def patch(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                if "name" in body:
                    s["name"] = (body.get("name") or "").strip()
                if "description" in body:
                    s["description"] = (body.get("description") or "").strip()
                if "days" in body:
                    s["days"] = body["days"] if isinstance(body["days"], list) else []
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, program_id, patch)


@router.delete("/api/profiles/{profile_name}/programs/{program_id}/sections/{section_id}")
def delete_section(profile_name: str, program_id: str, section_id: str, profile_id: str = Depends(require_profile_match)):

    def remove(b):
        prev = len(b["sections"])
        b["sections"] = [s for s in b["sections"] if s["id"] != section_id]
        if len(b["sections"]) == prev:
            raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, program_id, remove)


@router.post("/api/profiles/{profile_name}/programs/{program_id}/sections/{section_id}/exercises")
def add_exercises_to_section(
    profile_name: str, program_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)
):
    names = body.get("exerciseNames") or body.get("exercise_names") or []
    if not isinstance(names, list):
        names = []
    avoid = body.get("avoidDuplicates", True)

    def add_ex(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                existing = set(s["exerciseNames"])
                for n in names:
                    n = (n or "").strip()
                    if not n:
                        continue
                    if avoid and n in existing:
                        continue
                    s["exerciseNames"].append(n)
                    existing.add(n)
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, program_id, add_ex)


@router.delete(
    "/api/profiles/{profile_name}/programs/{program_id}/sections/{section_id}/exercises/{exercise_name}"
)
def remove_exercise_from_section(
    profile_name: str, program_id: str, section_id: str, exercise_name: str, profile_id: str = Depends(require_profile_match)
):
    ex = exercise_name.strip()

    def remove_ex(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                s["exerciseNames"] = [n for n in s["exerciseNames"] if n != ex]
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, program_id, remove_ex)


@router.put(
    "/api/profiles/{profile_name}/programs/{program_id}/sections/{section_id}/exercises/reorder"
)
def reorder_exercises_in_section(
    profile_name: str, program_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)
):
    names = body.get("exerciseNames") or body.get("exercise_names") or []
    if not isinstance(names, list):
        names = []

    def reorder(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                s["exerciseNames"] = [n for n in names if isinstance(n, str) and (n or "").strip()]
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, program_id, reorder)
