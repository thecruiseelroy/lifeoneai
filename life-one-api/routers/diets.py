"""
Diets and sections: file-based blueprint storage per profile.
Each diet is data/diets/{profile_id}/{diet_id}.json.
API shape: id, name, sections: [{ id, name, description, days, foodNames }].
"""
from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException

from database import get_connection
import diet_storage as storage
from routers.auth import require_profile_match

router = APIRouter(tags=["diets"])


def _normalize_blueprint(b: dict) -> dict:
    """Ensure blueprint has id, name, sections; sections have foodNames."""
    sections = []
    for s in (b.get("sections") or []):
        if not isinstance(s, dict):
            continue
        sections.append({
            "id": s.get("id") or str(uuid.uuid4()),
            "name": (s.get("name") or "").strip(),
            "description": (s.get("description") or "").strip(),
            "days": s.get("days") if isinstance(s.get("days"), list) else [],
            "foodNames": [x for x in (s.get("foodNames") or s.get("food_names") or []) if isinstance(x, str) and x.strip()],
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
    """Blueprint -> API response (sections with foodNames)."""
    return {
        "id": b["id"],
        "name": b["name"],
        "sections": [
            {
                "id": s["id"],
                "name": s["name"],
                "description": s["description"],
                "days": s["days"],
                "foodNames": s["foodNames"],
            }
            for s in b["sections"]
        ],
    }


@router.get("/api/profiles/{profile_name}/diets")
def list_diets(profile_name: str, profile_id: str = Depends(require_profile_match)):
    blueprints = storage.list_diets(profile_id)
    return [_to_response(b) for b in blueprints]


@router.get("/api/profiles/{profile_name}/diets/{diet_id}")
def get_diet(profile_name: str, diet_id: str, profile_id: str = Depends(require_profile_match)):
    b = storage.get_diet(profile_id, diet_id)
    if not b:
        raise HTTPException(status_code=404, detail="Diet not found")
    return _to_response(_normalize_blueprint(b))


@router.post("/api/profiles/{profile_name}/diets")
def create_diet(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    blueprint = storage.create_empty_blueprint(name)
    storage.save_diet(profile_id, blueprint)
    return _to_response(blueprint)


@router.put("/api/profiles/{profile_name}/diets/{diet_id}")
def update_diet(profile_name: str, diet_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
    b = storage.get_diet(profile_id, diet_id)
    if not b:
        raise HTTPException(status_code=404, detail="Diet not found")
    b = _normalize_blueprint(b)
    name = (body.get("name") or "").strip()
    if name:
        b["name"] = name
    storage.save_diet(profile_id, b)
    return _to_response(b)


@router.delete("/api/profiles/{profile_name}/diets/{diet_id}")
def delete_diet(profile_name: str, diet_id: str, profile_id: str = Depends(require_profile_match)):
    if not storage.delete_diet(profile_id, diet_id):
        raise HTTPException(status_code=404, detail="Diet not found")
    return {"ok": True}


def _load_mutate_save(profile_id: str, diet_id: str, mutate):
    b = storage.get_diet(profile_id, diet_id)
    if not b:
        raise HTTPException(status_code=404, detail="Diet not found")
    b = _normalize_blueprint(b)
    mutate(b)
    storage.save_diet(profile_id, b)
    return _to_response(b)


@router.post("/api/profiles/{profile_name}/diets/{diet_id}/sections")
def add_section(profile_name: str, diet_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
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
        "foodNames": [],
    }

    def add(b):
        b["sections"] = b["sections"] + [new_section]

    return _load_mutate_save(profile_id, diet_id, add)


@router.put("/api/profiles/{profile_name}/diets/{diet_id}/sections/{section_id}")
def update_section(profile_name: str, diet_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)):

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

    return _load_mutate_save(profile_id, diet_id, patch)


@router.delete("/api/profiles/{profile_name}/diets/{diet_id}/sections/{section_id}")
def delete_section(profile_name: str, diet_id: str, section_id: str, profile_id: str = Depends(require_profile_match)):

    def remove(b):
        prev = len(b["sections"])
        b["sections"] = [s for s in b["sections"] if s["id"] != section_id]
        if len(b["sections"]) == prev:
            raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, diet_id, remove)


@router.post("/api/profiles/{profile_name}/diets/{diet_id}/sections/{section_id}/foods")
def add_foods_to_section(
    profile_name: str, diet_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)
):
    names = body.get("foodNames") or body.get("food_names") or []
    if not isinstance(names, list):
        names = []
    avoid = body.get("avoidDuplicates", True)

    def add_food(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                existing = set(s["foodNames"])
                for n in names:
                    n = (n or "").strip()
                    if not n:
                        continue
                    if avoid and n in existing:
                        continue
                    s["foodNames"].append(n)
                    existing.add(n)
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, diet_id, add_food)


@router.delete(
    "/api/profiles/{profile_name}/diets/{diet_id}/sections/{section_id}/foods/{food_name}"
)
def remove_food_from_section(
    profile_name: str, diet_id: str, section_id: str, food_name: str, profile_id: str = Depends(require_profile_match)
):
    fn = food_name.strip()

    def remove_food(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                s["foodNames"] = [n for n in s["foodNames"] if n != fn]
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, diet_id, remove_food)


@router.put(
    "/api/profiles/{profile_name}/diets/{diet_id}/sections/{section_id}/foods/reorder"
)
def reorder_foods_in_section(
    profile_name: str, diet_id: str, section_id: str, body: dict, profile_id: str = Depends(require_profile_match)
):
    names = body.get("foodNames") or body.get("food_names") or []
    if not isinstance(names, list):
        names = []

    def reorder(b):
        for s in b["sections"]:
            if s["id"] == section_id:
                s["foodNames"] = [n for n in names if isinstance(n, str) and (n or "").strip()]
                return
        raise HTTPException(status_code=404, detail="Section not found")

    return _load_mutate_save(profile_id, diet_id, reorder)
