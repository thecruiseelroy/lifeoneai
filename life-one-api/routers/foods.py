"""
Foods API: list/search foods and get by id. Used by coach chat context and app.
"""
import json
from fastapi import APIRouter, Query

from database import get_connection

router = APIRouter(tags=["foods"])


@router.get("/api/foods")
def list_foods(
    q: str | None = Query(None, description="Search by name"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List foods, optionally filtered by name search."""
    conn = get_connection()
    try:
        if q and q.strip():
            pattern = f"%{q.strip()}%"
            rows = conn.execute(
                """
                SELECT id, name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients
                FROM foods
                WHERE name LIKE ?
                ORDER BY name
                LIMIT ? OFFSET ?
                """,
                (pattern, limit, offset),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients
                FROM foods
                ORDER BY name
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()
        items = []
        for r in rows:
            nutrients = None
            if r["nutrients"]:
                try:
                    nutrients = json.loads(r["nutrients"])
                except Exception:
                    nutrients = {}
            items.append({
                "id": r["id"],
                "name": r["name"],
                "usda_id": r["usda_id"],
                "fat": r["fat"],
                "calories": r["calories"],
                "proteins": r["proteins"],
                "carbohydrates": r["carbohydrates"],
                "serving": r["serving"],
                "nutrients": nutrients,
            })
        return {"foods": items, "count": len(items)}
    finally:
        conn.close()


@router.get("/api/foods/{food_id}")
def get_food(food_id: str):
    """Get one food by id (integer) or by name (exact match)."""
    conn = get_connection()
    try:
        if food_id.isdigit():
            row = conn.execute(
                "SELECT id, name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients FROM foods WHERE id = ?",
                (int(food_id),),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id, name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients FROM foods WHERE name = ?",
                (food_id.strip(),),
            ).fetchone()
        if not row:
            return {"food": None}
        nutrients = None
        if row["nutrients"]:
            try:
                nutrients = json.loads(row["nutrients"])
            except Exception:
                nutrients = {}
        return {
            "food": {
                "id": row["id"],
                "name": row["name"],
                "usda_id": row["usda_id"],
                "fat": row["fat"],
                "calories": row["calories"],
                "proteins": row["proteins"],
                "carbohydrates": row["carbohydrates"],
                "serving": row["serving"],
                "nutrients": nutrients,
            }
        }
    finally:
        conn.close()


def get_foods_summary_for_prompt(limit: int = 200) -> str:
    """Return a compact text summary of foods (name, cal, P, F, C, serving) for the chat system prompt."""
    try:
        conn = get_connection()
        try:
            rows = conn.execute(
                """
                SELECT name, calories, proteins, fat, carbohydrates, serving
                FROM foods
                ORDER BY name
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        finally:
            conn.close()
        if not rows:
            return ""
        lines = ["Foods database (per 100g unless noted). Name | calories | protein(mg) | fat(mg) | carbs(mg) | serving(g):"]
        for r in rows:
            lines.append(
                f"  {r['name']} | {r['calories']} | {r['proteins']} | {r['fat']} | {r['carbohydrates']} | {r['serving']}"
            )
        return "\n".join(lines)
    except Exception:
        return ""
