"""
Exercise history / workout logs: CRUD scoped by profile name.
Shape: WorkoutLogEntry { exerciseName, date, sets: [{ reps, weight?, note? }] }
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_connection
from routers.auth import require_profile_match

router = APIRouter(tags=["exercise_history"])


def _entry_to_dict(row, sets_list: list) -> dict:
    return {
        "exerciseName": row["exercise_name"],
        "date": row["date"],
        "sets": sets_list,
    }


@router.get("/api/profiles/{profile_name}/workout-logs")
def list_workout_logs(
    profile_name: str,
    exercise_name: str | None = Query(None, alias="exerciseName"),
    profile_id: str = Depends(require_profile_match),
):
    conn = get_connection()
    try:
        if exercise_name:
            rows = conn.execute(
                """SELECT id, exercise_name, date FROM exercise_history
                 WHERE profile_id = ? AND exercise_name = ? ORDER BY date DESC""",
                (profile_id, exercise_name.strip()),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT id, exercise_name, date FROM exercise_history
                 WHERE profile_id = ? ORDER BY date DESC""",
                (profile_id,),
            ).fetchall()
        result = []
        for r in rows:
            sets_rows = conn.execute(
                "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
                (r["id"],),
            ).fetchall()
            sets_list = [
                {
                    "reps": s["reps"],
                    "weight": s["weight_kg"] if s["weight_kg"] is not None else None,
                    "note": s["note"] or None,
                }
                for s in sets_rows
            ]
            result.append(_entry_to_dict(r, sets_list))
        return result
    finally:
        conn.close()


@router.get("/api/profiles/{profile_name}/workout-logs/last-date")
def get_last_date(
    profile_name: str,
    exercise_name: str = Query(..., alias="exerciseName"),
    profile_id: str = Depends(require_profile_match),
):
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT date FROM exercise_history
             WHERE profile_id = ? AND exercise_name = ?
             ORDER BY date DESC LIMIT 1""",
            (profile_id, exercise_name.strip()),
        ).fetchone()
        if not row:
            return {"date": None}
        return {"date": row["date"]}
    finally:
        conn.close()


def _get_or_create_history_id(conn, profile_id: str, exercise_name: str, date: str) -> str:
    row = conn.execute(
        "SELECT id FROM exercise_history WHERE profile_id = ? AND exercise_name = ? AND date = ?",
        (profile_id, exercise_name.strip(), date),
    ).fetchone()
    if row:
        return row["id"]
    history_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO exercise_history (id, profile_id, exercise_name, date) VALUES (?, ?, ?, ?)",
        (history_id, profile_id, exercise_name.strip(), date),
    )
    return history_id


@router.get("/api/profiles/{profile_name}/workout-logs/{exercise_name}/dates/{date}")
def get_log_for_date(
    profile_name: str, exercise_name: str, date: str, profile_id: str = Depends(require_profile_match)
):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, exercise_name, date FROM exercise_history WHERE profile_id = ? AND exercise_name = ? AND date = ?",
            (profile_id, exercise_name.strip(), date),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Log entry not found")
        sets_rows = conn.execute(
            "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
            (row["id"],),
        ).fetchall()
        sets_list = [
            {
                "reps": s["reps"],
                "weight": s["weight_kg"] if s["weight_kg"] is not None else None,
                "note": s["note"] or None,
            }
            for s in sets_rows
        ]
        return _entry_to_dict(row, sets_list)
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/workout-logs")
def get_or_create_log(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    """Get or create a log entry for exerciseName + date. Returns entry with sets."""
    exercise_name = (body.get("exerciseName") or body.get("exercise_name") or "").strip()
    date = (body.get("date") or "").strip()
    if not exercise_name or not date:
        raise HTTPException(status_code=400, detail="exerciseName and date are required")
    conn = get_connection()
    try:
        history_id = _get_or_create_history_id(conn, profile_id, exercise_name, date)
        conn.commit()
        row = conn.execute(
            "SELECT exercise_name, date FROM exercise_history WHERE id = ?",
            (history_id,),
        ).fetchone()
        sets_rows = conn.execute(
            "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
            (history_id,),
        ).fetchall()
        sets_list = [
            {
                "reps": s["reps"],
                "weight": s["weight_kg"] if s["weight_kg"] is not None else None,
                "note": s["note"] or None,
            }
            for s in sets_rows
        ]
        return _entry_to_dict(row, sets_list)
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/workout-logs/sets")
def add_set(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    exercise_name = (body.get("exerciseName") or body.get("exercise_name") or "").strip()
    date = (body.get("date") or "").strip()
    set_data = body.get("set") or body
    if not exercise_name or not date:
        raise HTTPException(status_code=400, detail="exerciseName and date are required")
    reps = set_data.get("reps")
    if reps is None:
        raise HTTPException(status_code=400, detail="set.reps is required")
    reps = int(reps)
    weight = set_data.get("weight")
    if weight is not None:
        weight = float(weight)
    note = (set_data.get("note") or "").strip() or None
    conn = get_connection()
    try:
        history_id = _get_or_create_history_id(conn, profile_id, exercise_name, date)
        max_idx = conn.execute(
            "SELECT COALESCE(MAX(set_index), -1) AS m FROM workout_sets WHERE exercise_history_id = ?",
            (history_id,),
        ).fetchone()["m"]
        set_index = max_idx + 1
        set_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO workout_sets (id, exercise_history_id, set_index, reps, weight_kg, note) VALUES (?, ?, ?, ?, ?, ?)",
            (set_id, history_id, set_index, reps, weight, note),
        )
        conn.commit()
        row = conn.execute(
            "SELECT exercise_name, date FROM exercise_history WHERE id = ?",
            (history_id,),
        ).fetchone()
        sets_rows = conn.execute(
            "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
            (history_id,),
        ).fetchall()
        sets_list = [
            {
                "reps": s["reps"],
                "weight": s["weight_kg"] if s["weight_kg"] is not None else None,
                "note": s["note"] or None,
            }
            for s in sets_rows
        ]
        return _entry_to_dict(row, sets_list)
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/workout-logs/sets")
def update_set(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    exercise_name = (body.get("exerciseName") or body.get("exercise_name") or "").strip()
    date = (body.get("date") or "").strip()
    set_index = body.get("setIndex") or body.get("set_index")
    if set_index is None:
        raise HTTPException(status_code=400, detail="setIndex is required")
    set_index = int(set_index)
    set_data = body.get("set") or body
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM exercise_history WHERE profile_id = ? AND exercise_name = ? AND date = ?",
            (profile_id, exercise_name, date),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Log entry not found")
        history_id = row["id"]
        sets_rows = conn.execute(
            "SELECT id, set_index, reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
            (history_id,),
        ).fetchall()
        if set_index < 0 or set_index >= len(sets_rows):
            raise HTTPException(status_code=404, detail="Set index out of range")
        set_row = sets_rows[set_index]
        set_id = set_row["id"]
        updates = []
        params = []
        if "reps" in set_data:
            updates.append("reps = ?")
            params.append(int(set_data["reps"]))
        if "weight" in set_data:
            updates.append("weight_kg = ?")
            params.append(float(set_data["weight"]) if set_data["weight"] is not None else None)
        if "note" in set_data:
            updates.append("note = ?")
            params.append((set_data["note"] or "").strip() or None)
        if not updates:
            row = conn.execute(
                "SELECT exercise_name, date FROM exercise_history WHERE id = ?",
                (history_id,),
            ).fetchone()
            sets_list = [
                {"reps": s["reps"], "weight": s["weight_kg"], "note": s["note"]}
                for s in conn.execute(
                    "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
                    (history_id,),
                ).fetchall()
            ]
            return _entry_to_dict(row, sets_list)
        params.append(set_id)
        conn.execute(
            "UPDATE workout_sets SET " + ", ".join(updates) + " WHERE id = ?",
            params,
        )
        conn.commit()
        row = conn.execute(
            "SELECT exercise_name, date FROM exercise_history WHERE id = ?",
            (history_id,),
        ).fetchone()
        sets_list = [
            {"reps": s["reps"], "weight": s["weight_kg"] if s["weight_kg"] is not None else None, "note": s["note"] or None}
            for s in conn.execute(
                "SELECT reps, weight_kg, note FROM workout_sets WHERE exercise_history_id = ? ORDER BY set_index",
                (history_id,),
            ).fetchall()
        ]
        return _entry_to_dict(row, sets_list)
    finally:
        conn.close()
