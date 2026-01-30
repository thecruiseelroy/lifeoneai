-- User-provided context for the coach: transcripts, blogs, or general text.
-- Content is injected into the system prompt when building chat context.

CREATE TABLE IF NOT EXISTS coach_context_files (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('transcript', 'blog', 'general')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coach_context_files_profile_id ON coach_context_files(profile_id);
