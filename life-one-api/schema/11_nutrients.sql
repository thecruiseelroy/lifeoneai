-- Nutrients: reference data for vitamins, minerals, amino acids, fatty acids.
-- Values in micrograms (µg) unless noted. RDA = Recommended Daily Allowance, TUI = Tolerable Upper Intake (optional).
CREATE TABLE IF NOT EXISTS nutrients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  rda_ug REAL NOT NULL,
  tui_ug REAL,
  required INTEGER NOT NULL DEFAULT 1,
  wiki_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nutrients_type ON nutrients(type);
CREATE INDEX IF NOT EXISTS idx_nutrients_name ON nutrients(name);
