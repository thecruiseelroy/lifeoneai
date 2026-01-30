-- Foods: name, USDA id, macros per 100g, serving size, nutrients (JSON).
-- Macros: fat, proteins, carbohydrates in mg per 100g; calories in kcal per 100g (or per gram in source).
CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  usda_id TEXT,
  fat INTEGER NOT NULL DEFAULT 0,
  calories REAL NOT NULL DEFAULT 0,
  proteins INTEGER NOT NULL DEFAULT 0,
  carbohydrates INTEGER NOT NULL DEFAULT 0,
  serving INTEGER NOT NULL DEFAULT 100,
  nutrients TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_usda_id ON foods(usda_id);
