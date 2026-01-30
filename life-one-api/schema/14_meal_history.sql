-- Meal history: one row per day per profile (meal log for that date).
CREATE TABLE IF NOT EXISTS meal_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meal_history_profile_id ON meal_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_date ON meal_history(profile_id, date);
