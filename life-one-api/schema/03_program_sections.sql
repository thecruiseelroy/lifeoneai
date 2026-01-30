-- Program sections: e.g. Push, Pull, Legs within a program.
-- Columns: id (UUID), program_id (FK), name, description, days (JSON array of day names).
CREATE TABLE IF NOT EXISTS program_sections (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  days TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_program_sections_program_id ON program_sections(program_id);
