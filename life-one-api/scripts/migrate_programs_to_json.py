"""
One-time migration: export DB programs to JSON blueprint files.
Run from API root: python -m scripts.migrate_programs_to_json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Run from life-one-api root
API_ROOT = Path(__file__).resolve().parent.parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from database import get_connection
import program_storage as storage


def build_blueprint_from_db(conn, program_id: str) -> dict | None:
    prog = conn.execute("SELECT id, name FROM programs WHERE id = ?", (program_id,)).fetchone()
    if not prog:
        return None
    rows = conn.execute(
        "SELECT id, name, description, days FROM program_sections WHERE program_id = ? ORDER BY created_at",
        (program_id,),
    ).fetchall()
    sections = []
    for s in rows:
        days = json.loads(s["days"] or "[]")
        ex = conn.execute(
            "SELECT exercise_name FROM program_section_exercises WHERE section_id = ? ORDER BY sort_order",
            (s["id"],),
        ).fetchall()
        exercise_names = [r["exercise_name"] for r in ex]
        sections.append({
            "id": s["id"],
            "name": s["name"],
            "description": s["description"] or "",
            "days": days,
            "exerciseNames": exercise_names,
        })
    return {
        "id": prog["id"],
        "name": prog["name"],
        "sections": sections,
    }


def main() -> None:
    conn = get_connection()
    try:
        profiles = conn.execute("SELECT id FROM profiles").fetchall()
        for pr in profiles:
            pid = pr["id"]
            progs = conn.execute(
                "SELECT id FROM programs WHERE profile_id = ? ORDER BY created_at",
                (pid,),
            ).fetchall()
            for p in progs:
                bp = build_blueprint_from_db(conn, p["id"])
                if bp:
                    storage.save_program(pid, bp)
                    print(f"Migrated program {bp['id']} ({bp['name']}) for profile {pid}")
    finally:
        conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
