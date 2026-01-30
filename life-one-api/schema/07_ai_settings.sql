-- Per-profile AI/OpenRouter settings. One row per profile.
-- openrouter_api_key is stored server-side only and never returned to frontend.
-- Columns: profile_id (FK), openrouter_api_key, openrouter_model, temperature, max_tokens, created_at, updated_at.
CREATE TABLE IF NOT EXISTS ai_settings (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  openrouter_api_key TEXT,
  openrouter_model TEXT NOT NULL DEFAULT 'openai/gpt-4o',
  temperature REAL NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
