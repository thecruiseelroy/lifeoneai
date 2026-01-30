"""
Meal logs: CRUD scoped by profile name.
Shape: MealLogEntry { date, foods: [{ foodId?, foodName?, amountGrams, note? }] }
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException

from database import get_connection
from routers.auth import require_profile_match

router = APIRouter(tags=["meals"])


def _meal_log_to_dict(row, foods_list: list) -> dict:
    return {
        "date": row["date"],
        "foods": foods_list,
    }


def _row_to_food_entry(r) -> dict:
    out = {
        "id": r["id"],
        "amountGrams": r["amount_grams"],
        "note": r["note"] or None,
    }
    if r["food_id"] is not None:
        out["foodId"] = r["food_id"]
    if r["food_name"]:
        out["foodName"] = r["food_name"]
    return out


@router.get("/api/profiles/{profile_name}/meal-logs")
def list_meal_logs(
    profile_name: str,
    date: str | None = None,
    dateFrom: str | None = None,
    dateTo: str | None = None,
    profile_id: str = Depends(require_profile_match),
):
    conn = get_connection()
    try:
        if date:
            rows = conn.execute(
                """SELECT id, date FROM meal_history
                 WHERE profile_id = ? AND date = ? ORDER BY date DESC""",
                (profile_id, date.strip()),
            ).fetchall()
        elif dateFrom or dateTo:
            if dateFrom and dateTo:
                rows = conn.execute(
                    """SELECT id, date FROM meal_history
                     WHERE profile_id = ? AND date >= ? AND date <= ? ORDER BY date DESC""",
                    (profile_id, dateFrom.strip(), dateTo.strip()),
                ).fetchall()
            elif dateFrom:
                rows = conn.execute(
                    """SELECT id, date FROM meal_history
                     WHERE profile_id = ? AND date >= ? ORDER BY date DESC""",
                    (profile_id, dateFrom.strip()),
                ).fetchall()
            else:
                rows = conn.execute(
                    """SELECT id, date FROM meal_history
                     WHERE profile_id = ? AND date <= ? ORDER BY date DESC""",
                    (profile_id, dateTo.strip()),
                ).fetchall()
        else:
            rows = conn.execute(
                """SELECT id, date FROM meal_history
                 WHERE profile_id = ? ORDER BY date DESC LIMIT 100""",
                (profile_id,),
            ).fetchall()
        result = []
        for r in rows:
            food_rows = conn.execute(
                """SELECT id, food_id, food_name, amount_grams, note, display_order
                 FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
                (r["id"],),
            ).fetchall()
            foods_list = [_row_to_food_entry(f) for f in food_rows]
            result.append(_meal_log_to_dict(r, foods_list))
        return result
    finally:
        conn.close()


@router.get("/api/profiles/{profile_name}/meal-logs/dates/{date}")
def get_meal_log_for_date(profile_name: str, date: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, date FROM meal_history WHERE profile_id = ? AND date = ?",
            (profile_id, date.strip()),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Meal log not found")
        food_rows = conn.execute(
            """SELECT id, food_id, food_name, amount_grams, note, display_order
             FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
            (row["id"],),
        ).fetchall()
        foods_list = [_row_to_food_entry(f) for f in food_rows]
        return _meal_log_to_dict(row, foods_list)
    finally:
        conn.close()


def _get_or_create_meal_history_id(conn, profile_id: str, date: str) -> str:
    row = conn.execute(
        "SELECT id FROM meal_history WHERE profile_id = ? AND date = ?",
        (profile_id, date.strip()),
    ).fetchone()
    if row:
        return row["id"]
    history_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO meal_history (id, profile_id, date) VALUES (?, ?, ?)",
        (history_id, profile_id, date.strip()),
    )
    return history_id


@router.post("/api/profiles/{profile_name}/meal-logs")
def create_meal_log(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    """Get or create a meal log for date. Returns log with foods."""
    date = (body.get("date") or "").strip()
    if not date:
        raise HTTPException(status_code=400, detail="date is required")
    conn = get_connection()
    try:
        history_id = _get_or_create_meal_history_id(conn, profile_id, date)
        conn.commit()
        row = conn.execute(
            "SELECT id, date FROM meal_history WHERE id = ?",
            (history_id,),
        ).fetchone()
        food_rows = conn.execute(
            """SELECT id, food_id, food_name, amount_grams, note, display_order
             FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
            (history_id,),
        ).fetchall()
        foods_list = [_row_to_food_entry(f) for f in food_rows]
        return _meal_log_to_dict(row, foods_list)
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/meal-logs/foods")
def add_food_to_meal_log(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    date = (body.get("date") or "").strip()
    food_id = body.get("foodId") or body.get("food_id")
    food_name = (body.get("foodName") or body.get("food_name") or "").strip()
    amount_grams = body.get("amountGrams") or body.get("amount_grams")
    if amount_grams is None:
        amount_grams = 100
    amount_grams = float(amount_grams)
    note = (body.get("note") or "").strip() or None
    if not date:
        raise HTTPException(status_code=400, detail="date is required")
    if food_id is None and not food_name:
        raise HTTPException(status_code=400, detail="foodId or foodName is required")
    conn = get_connection()
    try:
        history_id = _get_or_create_meal_history_id(conn, profile_id, date)
        max_order = conn.execute(
            "SELECT COALESCE(MAX(display_order), -1) AS m FROM meal_foods WHERE meal_history_id = ?",
            (history_id,),
        ).fetchone()["m"]
        display_order = max_order + 1
        food_entry_id = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO meal_foods (id, meal_history_id, food_id, food_name, amount_grams, note, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (food_entry_id, history_id, food_id, food_name if food_name else None, amount_grams, note, display_order),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, date FROM meal_history WHERE id = ?",
            (history_id,),
        ).fetchone()
        food_rows = conn.execute(
            """SELECT id, food_id, food_name, amount_grams, note, display_order
             FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
            (history_id,),
        ).fetchall()
        foods_list = [_row_to_food_entry(f) for f in food_rows]
        return _meal_log_to_dict(row, foods_list)
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/meal-logs/foods/{food_entry_id}")
def update_meal_food(profile_name: str, food_entry_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT mf.id, mf.meal_history_id FROM meal_foods mf "
            "JOIN meal_history mh ON mf.meal_history_id = mh.id WHERE mf.id = ? AND mh.profile_id = ?",
            (food_entry_id, profile_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Food entry not found")
        updates = []
        params = []
        if "amountGrams" in body or "amount_grams" in body:
            val = body.get("amountGrams") or body.get("amount_grams")
            if val is not None:
                updates.append("amount_grams = ?")
                params.append(float(val))
        if "note" in body:
            updates.append("note = ?")
            params.append((body.get("note") or "").strip() or None)
        mh_id = row["meal_history_id"]
        if not updates:
            mh_row = conn.execute(
                "SELECT id, date FROM meal_history WHERE id = ?",
                (mh_id,),
            ).fetchone()
            food_rows = conn.execute(
                """SELECT id, food_id, food_name, amount_grams, note, display_order
                 FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
                (mh_id,),
            ).fetchall()
            return _meal_log_to_dict(mh_row, [_row_to_food_entry(f) for f in food_rows])
        params.append(food_entry_id)
        conn.execute(
            "UPDATE meal_foods SET " + ", ".join(updates) + " WHERE id = ?",
            params,
        )
        conn.commit()
        mh_row = conn.execute(
            "SELECT id, date FROM meal_history WHERE id = ?",
            (mh_id,),
        ).fetchone()
        food_rows = conn.execute(
            """SELECT id, food_id, food_name, amount_grams, note, display_order
             FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
            (mh_id,),
        ).fetchall()
        return _meal_log_to_dict(mh_row, [_row_to_food_entry(f) for f in food_rows])
    finally:
        conn.close()


@router.delete("/api/profiles/{profile_name}/meal-logs/foods/{food_entry_id}")
def delete_meal_food(profile_name: str, food_entry_id: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT mf.id, mf.meal_history_id FROM meal_foods mf "
            "JOIN meal_history mh ON mf.meal_history_id = mh.id WHERE mf.id = ? AND mh.profile_id = ?",
            (food_entry_id, profile_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Food entry not found")
        conn.execute("DELETE FROM meal_foods WHERE id = ?", (food_entry_id,))
        conn.commit()
        mh_row = conn.execute(
            "SELECT id, date FROM meal_history WHERE id = ?",
            (row["meal_history_id"],),
        ).fetchone()
        food_rows = conn.execute(
            """SELECT id, food_id, food_name, amount_grams, note, display_order
             FROM meal_foods WHERE meal_history_id = ? ORDER BY display_order, created_at""",
            (row["meal_history_id"],),
        ).fetchall()
        return _meal_log_to_dict(mh_row, [_row_to_food_entry(f) for f in food_rows])
    finally:
        conn.close()
