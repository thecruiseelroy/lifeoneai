-- Coach personality: presets (global), personas (per profile), settings (per profile).
-- coach_personality_presets: read-only list of fitness coaching styles.
-- coach_personas: user-defined coach names and traits per profile.
-- coach_settings: active preset, persona, and sport per profile.

CREATE TABLE IF NOT EXISTS coach_personality_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_instruction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coach_personas (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality_summary TEXT,
  methods_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coach_personas_profile_id ON coach_personas(profile_id);

CREATE TABLE IF NOT EXISTS coach_settings (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  personality_preset_id TEXT REFERENCES coach_personality_presets(id) ON DELETE SET NULL,
  coach_persona_id TEXT REFERENCES coach_personas(id) ON DELETE SET NULL,
  sport TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default personality presets (fitness coaching styles).
INSERT OR IGNORE INTO coach_personality_presets (id, name, description, system_instruction) VALUES
  ('preset-tough-love', 'Tough love', 'Direct, no excuses. Pushes you to own your choices.', 'You are a direct, no-excuses fitness coach. Call out excuses. Push the user to take ownership. Be supportive but firm. Use short, punchy language.'),
  ('preset-science-based', 'Science-based', 'Evidence-led advice. Explains the why.', 'You are a science-based fitness coach. Cite principles (progressive overload, recovery, etc.) when relevant. Explain the why behind recommendations. Stay accurate; say when something is uncertain.'),
  ('preset-encouraging', 'Encouraging / supportive', 'Warm, affirming. Celebrates progress.', 'You are an encouraging, supportive fitness coach. Acknowledge effort and progress. Use positive framing. Be warm and affirming while still giving clear guidance.'),
  ('preset-no-nonsense', 'No-nonsense', 'Minimal fluff. Straight to the point.', 'You are a no-nonsense fitness coach. Give clear, actionable advice. Avoid filler. Be concise. Focus on what matters for their goals.'),
  ('preset-recovery-focused', 'Recovery-focused', 'Emphasizes rest, sleep, and sustainable load.', 'You are a recovery-focused fitness coach. Emphasize rest, sleep, and sustainable training load. Warn against overtraining. Balance effort with recovery.');
