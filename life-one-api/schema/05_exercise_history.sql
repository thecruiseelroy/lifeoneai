-- Exercise history: one row per "log day" per exercise (one workout session for that exercise on that date).
-- Columns: id (UUID), profile_id (FK), exercise_name, date (YYYY-MM-DD), created_at.
CREATE TABLE IF NOT EXISTS exercise_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profile_id, exercise_name, date)
);

CREATE INDEX IF NOT EXISTS idx_exercise_history_profile_id ON exercise_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_exercise_history_date ON exercise_history(profile_id, date);
