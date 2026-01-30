"""
Seed the nutrients table from a JSON file (vitamins, minerals, amino acids, fatty acids).
Ensures schema 11_nutrients is applied, then upserts all records.

Usage (from life-one-api directory):
  python -m scripts.seed_nutrients
  python -m scripts.seed_nutrients "C:/Users/Sean Craig/Downloads/nutrients.json"
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import get_connection, SCHEMA_DIR

DEFAULT_JSON = ROOT / "data" / "nutrients.json"


def ensure_schema(conn) -> None:
    """Run 11_nutrients.sql if present so the table exists."""
    schema_file = SCHEMA_DIR / "11_nutrients.sql"
    if schema_file.exists():
        conn.executescript(schema_file.read_text(encoding="utf-8"))
        conn.commit()


def load_nutrients(json_path: Path) -> list[dict]:
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Expected JSON array of nutrient objects")
    return data


def seed(conn, nutrients: list[dict]) -> int:
    count = 0
    for n in nutrients:
        name = n.get("name")
        if not name:
            continue
        rda = n.get("rda")
        if rda is None:
            continue
        ntype = n.get("type") or "Other"
        tui = n.get("tui")
        required = 1 if n.get("required", True) else 0
        wiki = n.get("wiki") or None
        conn.execute(
            """
            INSERT INTO nutrients (name, type, rda_ug, tui_ug, required, wiki_url)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
              type = excluded.type,
              rda_ug = excluded.rda_ug,
              tui_ug = excluded.tui_ug,
              required = excluded.required,
              wiki_url = excluded.wiki_url,
              updated_at = datetime('now')
            """,
            (name, ntype, float(rda), float(tui) if tui is not None else None, required, wiki),
        )
        count += 1
    return count


def main() -> None:
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_JSON
    if not json_path.is_absolute():
        json_path = ROOT / json_path
    if not json_path.exists():
        print(f"Nutrients JSON not found: {json_path}", file=sys.stderr)
        print("Usage: python -m scripts.seed_nutrients [path/to/nutrients.json]", file=sys.stderr)
        sys.exit(1)

    nutrients = load_nutrients(json_path)
    conn = get_connection()
    try:
        ensure_schema(conn)
        n = seed(conn, nutrients)
        conn.commit()
        print(f"Seeded {n} nutrients from {json_path}.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
