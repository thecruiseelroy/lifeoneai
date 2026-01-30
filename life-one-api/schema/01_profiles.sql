-- Profiles: one row per user profile (save/load by name).
-- Columns: id (UUID PK), name (UNIQUE display name), created_at, updated_at.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
