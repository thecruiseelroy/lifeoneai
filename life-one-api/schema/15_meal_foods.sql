-- Meal foods: individual food entries belonging to a meal_history row.
-- food_id references foods.id; amount_grams is per 100g scale (or serving multiplier).
CREATE TABLE IF NOT EXISTS meal_foods (
  id TEXT PRIMARY KEY,
  meal_history_id TEXT NOT NULL REFERENCES meal_history(id) ON DELETE CASCADE,
  food_id INTEGER REFERENCES foods(id),
  food_name TEXT,
  amount_grams REAL NOT NULL DEFAULT 100,
  note TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meal_foods_meal_history_id ON meal_foods(meal_history_id);
