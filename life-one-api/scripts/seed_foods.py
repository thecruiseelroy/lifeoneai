"""
Seed the foods table from foods.json (name, usda_id, macros, serving, nutrients).
Runs schema 12_foods.sql then inserts/updates all records.

Usage (from life-one-api directory):
  python -m scripts.seed_foods
  python -m scripts.seed_foods "C:\\Users\\Sean Craig\\Downloads\\foods.json"
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import get_connection, SCHEMA_DIR

DEFAULT_JSON = ROOT / "data" / "foods.json"


def ensure_schema(conn) -> None:
    """Run 12_foods.sql so the table exists."""
    schema_file = SCHEMA_DIR / "12_foods.sql"
    if schema_file.exists():
        conn.executescript(schema_file.read_text(encoding="utf-8"))
        conn.commit()


def _num(v, default=0):
    if v is None:
        return default
    try:
        return int(v)
    except (TypeError, ValueError):
        try:
            return float(v)
        except (TypeError, ValueError):
            return default


def _normalize_json_text(text: str) -> str:
    """Quote unquoted numeric object keys so JSON parser accepts them (e.g. 0: -> \"0\":)."""
    return re.sub(r"(?<=[\{\,])\s*(\d+)\s*:", r' "\1":', text)


def load_foods(json_path: Path) -> list[dict]:
    raw = json_path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = json.loads(_normalize_json_text(raw))
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [
            v
            for k, v in sorted(
                data.items(),
                key=lambda x: int(x[0]) if str(x[0]).isdigit() else 0,
            )
            if isinstance(v, dict)
        ]
    raise ValueError("Expected JSON array or object of food objects")


def _macro_int(v) -> int:
    """Store as mg per 100g: if value looks like grams (< 1000), convert to mg."""
    x = _num(v, 0)
    if isinstance(x, float):
        return int(round(x * 1000)) if x < 1000 else int(round(x))
    return int(x) if x < 1000 else x


def _normalize_food(f: dict) -> dict | None:
    """Extract DB fields from either API-style (usda, fat) or camelCase (totalFat, protein)."""
    name = (f.get("name") or "").strip()
    if not name:
        return None
    usda_id = f.get("usda_id")
    if usda_id is not None:
        usda_id = str(usda_id).strip() or None
    fat = _macro_int(f.get("fat") or f.get("totalFat"))
    calories = _num(f.get("calories"), 0)
    if isinstance(calories, int):
        calories = float(calories)
    proteins = _macro_int(f.get("proteins") or f.get("protein"))
    carbohydrates = _macro_int(f.get("carbohydrates") or f.get("carbohydrate"))
    serving = _num(f.get("serving"), 100)
    nutrients = f.get("nutrients")
    nutrients_json = json.dumps(nutrients) if nutrients is not None else None
    return {
        "name": name,
        "usda_id": usda_id,
        "fat": fat,
        "calories": calories,
        "proteins": proteins,
        "carbohydrates": carbohydrates,
        "serving": serving,
        "nutrients": nutrients_json,
    }


def seed(conn, foods: list[dict]) -> int:
    count = 0
    for f in foods:
        row = _normalize_food(f)
        if not row:
            continue
        conn.execute(
            """
            INSERT INTO foods (name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row["name"],
                row["usda_id"],
                row["fat"],
                row["calories"],
                row["proteins"],
                row["carbohydrates"],
                row["serving"],
                row["nutrients"],
            ),
        )
        count += 1
    return count


def main() -> None:
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_JSON
    if not json_path.is_absolute():
        json_path = ROOT / json_path
    if not json_path.exists():
        print(f"Foods JSON not found: {json_path}", file=sys.stderr)
        print("Usage: python -m scripts.seed_foods [path/to/foods.json]", file=sys.stderr)
        sys.exit(1)

    foods = load_foods(json_path)
    conn = get_connection()
    try:
        ensure_schema(conn)
        conn.execute("DELETE FROM foods")
        n = seed(conn, foods)
        conn.commit()
        print(f"Seeded {n} foods from {json_path}.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
