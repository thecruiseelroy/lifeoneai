-- Workout sets: individual sets belonging to an exercise_history row.
-- Columns: id (UUID), exercise_history_id (FK), set_index (0-based), reps, weight_kg (NULL ok), note (TEXT NULL).
CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  exercise_history_id TEXT NOT NULL REFERENCES exercise_history(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_history_id ON workout_sets(exercise_history_id);
