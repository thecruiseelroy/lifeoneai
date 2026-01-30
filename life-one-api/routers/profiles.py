"""
Profiles: list (current user only), get by name, update, import. All require auth.
Profile creation is via POST /api/auth/register.
"""
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException

from database import get_connection
from routers.auth import get_current_profile, require_profile_match

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _profile_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@router.get("")
def list_profiles(current: tuple[str, str] = Depends(get_current_profile)):
    """Return only the current user's profile."""
    profile_id, _ = current
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, name, created_at, updated_at FROM profiles WHERE id = ?",
            (profile_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return [_profile_row_to_dict(row)]
    finally:
        conn.close()


@router.get("/{profile_name}")
def get_profile_by_name(
    profile_name: str, _profile_id: str = Depends(require_profile_match)
):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, name, created_at, updated_at FROM profiles WHERE name = ?",
            (profile_name.strip(),),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return _profile_row_to_dict(row)
    finally:
        conn.close()


@router.patch("/{profile_name}")
def update_profile(
    profile_name: str, body: dict, _profile_id: str = Depends(require_profile_match)
):
    """Update profile display name. Validates uniqueness."""
    new_name = (body.get("name") or "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="name is required")
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM profiles WHERE name = ?",
            (profile_name.strip(),),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        existing = conn.execute("SELECT id FROM profiles WHERE name = ?", (new_name,)).fetchone()
        if existing and existing["id"] != row["id"]:
            raise HTTPException(status_code=409, detail="Profile with this name already exists")
        if new_name == profile_name.strip():
            row = conn.execute(
                "SELECT id, name, created_at, updated_at FROM profiles WHERE id = ?",
                (row["id"],),
            ).fetchone()
            return _profile_row_to_dict(row)
        conn.execute(
            "UPDATE profiles SET name = ?, updated_at = datetime('now') WHERE id = ?",
            (new_name, row["id"]),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, created_at, updated_at FROM profiles WHERE id = ?",
            (row["id"],),
        ).fetchone()
        return _profile_row_to_dict(row)
    finally:
        conn.close()


@router.post("/import")
def import_profile(body: dict, current: tuple[str, str] = Depends(get_current_profile)):
    """Create a profile and import programs + workout logs (migration from localStorage). Auth: name must match current user."""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    _profile_id, current_name = current
    if name != current_name:
        raise HTTPException(status_code=403, detail="Forbidden")
    programs = body.get("programs") or []
    workout_logs = body.get("workoutLogs") or body.get("workout_logs") or []
    if not isinstance(programs, list):
        programs = []
    if not isinstance(workout_logs, list):
        workout_logs = []

    conn = get_connection()
    try:
        profile_id = _profile_id  # import into current user's profile
        for prog in programs:
            prog_id = prog.get("id") or str(uuid.uuid4())
            prog_name = (prog.get("name") or "").strip() or "Program"
            conn.execute(
                "INSERT INTO programs (id, profile_id, name) VALUES (?, ?, ?)",
                (prog_id, profile_id, prog_name),
            )
            for s in prog.get("sections") or []:
                s_id = s.get("id") or str(uuid.uuid4())
                s_name = (s.get("name") or "").strip() or "Section"
                s_desc = (s.get("description") or "").strip()
                s_days = json.dumps(s.get("days") if isinstance(s.get("days"), list) else [])
                conn.execute(
                    "INSERT INTO program_sections (id, program_id, name, description, days) VALUES (?, ?, ?, ?, ?)",
                    (s_id, prog_id, s_name, s_desc, s_days),
                )
                for i, ex_name in enumerate(s.get("exerciseNames") or s.get("exercise_names") or []):
                    ex = (ex_name or "").strip()
                    if ex:
                        conn.execute(
                            "INSERT INTO program_section_exercises (section_id, exercise_name, sort_order) VALUES (?, ?, ?)",
                            (s_id, ex, i),
                        )

        for entry in workout_logs:
            ex_name = (entry.get("exerciseName") or entry.get("exercise_name") or "").strip()
            date = (entry.get("date") or "").strip()
            if not ex_name or not date:
                continue
            history_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO exercise_history (id, profile_id, exercise_name, date) VALUES (?, ?, ?, ?)",
                (history_id, profile_id, ex_name, date),
            )
            for i, s in enumerate(entry.get("sets") or []):
                reps = s.get("reps")
                if reps is None:
                    continue
                weight = s.get("weight")
                if weight is not None:
                    weight = float(weight)
                note = (s.get("note") or "").strip() or None
                conn.execute(
                    "INSERT INTO workout_sets (id, exercise_history_id, set_index, reps, weight_kg, note) VALUES (?, ?, ?, ?, ?, ?)",
                    (str(uuid.uuid4()), history_id, i, int(reps), weight, note),
                )

        conn.commit()
        row = conn.execute(
            "SELECT id, name, created_at, updated_at FROM profiles WHERE id = ?",
            (profile_id,),
        ).fetchone()
        return _profile_row_to_dict(row)
    finally:
        conn.close()
