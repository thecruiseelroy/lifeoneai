"""
Database init: run schema files in order and provide get_connection.
"""
import os
import sqlite3
from pathlib import Path

DB_PATH = os.environ.get("LIFE_ONE_DB", "life_one.db")
SCHEMA_DIR = Path(__file__).resolve().parent / "schema"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Run all schema/*.sql files in order (01_ ... 16_ etc.)."""
    conn = get_connection()
    try:
        schema_files = sorted(Path(SCHEMA_DIR).glob("*.sql"))
        for path in schema_files:
            if path.suffix == ".sql" and path.name[0:1].isdigit():
                sql = path.read_text(encoding="utf-8")
                try:
                    conn.executescript(sql)
                except sqlite3.OperationalError as e:
                    if "duplicate column" in str(e).lower():
                        pass  # migration already applied
                    else:
                        raise
        conn.commit()
    finally:
        conn.close()
