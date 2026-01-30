"""
LLM context: GET /api/profiles/{profile_name}/context
Returns profile, programs (with sections and exercise names), and recent exercise history.
Programs are loaded from JSON blueprint files (program_storage).
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_connection
import program_storage as storage
from routers.auth import require_profile_match

router = APIRouter(tags=["context"])


def _blueprint_to_context_program(b: dict) -> dict:
    """Map stored blueprint to context program shape (id, name, sections with exerciseNames)."""
    sections = []
    for s in (b.get("sections") or []):
        if not isinstance(s, dict):
            continue
        sections.append({
            "id": s.get("id", ""),
            "name": s.get("name", ""),
            "description": s.get("description", ""),
            "days": s.get("days") if isinstance(s.get("days"), list) else [],
            "exerciseNames": [x for x in (s.get("exerciseNames") or s.get("exercise_names") or []) if isinstance(x, str)],
        })
    return {"id": b.get("id", ""), "name": b.get("name", ""), "sections": sections}


def build_context_dict(profile_id: str, limit_days: int = 30) -> dict | None:
    """Build profile context dict (profile, programs, exercise_history). Used by GET context and chat."""
    conn = get_connection()
    try:
        profile_row = conn.execute(
            "SELECT id, name FROM profiles WHERE id = ?", (profile_id,)
        ).fetchone()
        if not profile_row:
            return None
        profile_data = {"id": profile_row["id"], "name": profile_row["name"]}

        blueprints = storage.list_programs(profile_id)
        programs_data = [_blueprint_to_context_program(b) for b in blueprints]

        history_rows = conn.execute(
            """SELECT eh.id, eh.exercise_name, eh.date FROM exercise_history eh
             WHERE eh.profile_id = ?
             ORDER BY eh.date DESC LIMIT 500""",
            (profile_id,),
        ).fetchall()
        history_entries = []
        for r in history_rows:
            sets_rows = conn.execute(
                "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
                (r["id"],),
            ).fetchall()
            sets_list = [
                {"reps": s["reps"], "weight_kg": s["weight_kg"], "note": s["note"]}
                for s in sets_rows
            ]
            history_entries.append({
                "exercise_name": r["exercise_name"],
                "date": r["date"],
                "sets": sets_list,
            })
        if limit_days < 365:
            from datetime import datetime, timedelta
            cutoff = (datetime.utcnow() - timedelta(days=limit_days)).strftime("%Y-%m-%d")
            history_entries = [e for e in history_entries if e["date"] >= cutoff]

        return {
            "profile": profile_data,
            "programs": programs_data,
            "exercise_history": history_entries,
        }
    finally:
        conn.close()


@router.get("/api/profiles/{profile_name}/context")
def get_profile_context(
    profile_name: str,
    format: str | None = Query(None),
    limit_days: int = Query(30, alias="limitDays", ge=1, le=365),
    profile_id: str = Depends(require_profile_match),
):
    context = build_context_dict(profile_id, limit_days)
    if not context:
        raise HTTPException(status_code=404, detail="Profile not found")

    if format == "text":
        profile_data = context["profile"]
        programs_data = context["programs"]
        history_entries = context["exercise_history"]
        lines = [
            f"Profile: {profile_data['name']} (id: {profile_data['id']})",
            "",
            "Programs:",
        ]
        for p in programs_data:
            lines.append(f"  - {p['name']}")
            for s in p["sections"]:
                lines.append(f"    Section: {s['name']} (days: {', '.join(s['days'])})")
                lines.append(f"      Exercises: {', '.join(s['exerciseNames'])}")
        lines.append("")
        lines.append("Recent exercise history:")
        for e in history_entries[:100]:
            sets_str = ", ".join(f"{s['reps']} reps" + (f" @ {s['weight_kg']} kg" if s.get("weight_kg") else "") for s in e["sets"])
            lines.append(f"  {e['date']} {e['exercise_name']}: {sets_str}")
        return "\n".join(lines)

    return context
