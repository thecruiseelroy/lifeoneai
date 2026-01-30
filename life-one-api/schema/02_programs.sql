-- Programs: workout programs owned by a profile.
-- Columns: id (UUID), profile_id (FK to profiles), name, created_at, updated_at.
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_programs_profile_id ON programs(profile_id);
