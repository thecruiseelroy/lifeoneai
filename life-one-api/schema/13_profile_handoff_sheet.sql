-- Profile handoff sheet: one RAG-style context document per profile for the coach.
-- User uploads a single profile sheet (e.g. health_and_fitness_handoff_sheet_for_coach_agent.md).
-- Content is injected into the coach system prompt as "Client Handoff Sheet".

CREATE TABLE IF NOT EXISTS profile_handoff_sheet (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profile_handoff_sheet_profile_id ON profile_handoff_sheet(profile_id);
