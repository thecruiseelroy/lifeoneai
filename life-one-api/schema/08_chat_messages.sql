-- Health-coach conversation messages. Enables continuity for coach chat.
-- Columns: id (UUID), profile_id (FK), role (user | assistant | system), content (TEXT), created_at.
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_profile_id ON chat_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(profile_id, created_at);
