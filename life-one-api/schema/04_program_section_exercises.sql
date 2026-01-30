-- Section–exercise link: ordered list of exercises per section.
-- Columns: section_id (FK), exercise_name, sort_order (0-based).
CREATE TABLE IF NOT EXISTS program_section_exercises (
  section_id TEXT NOT NULL REFERENCES program_sections(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, exercise_name)
);

CREATE INDEX IF NOT EXISTS idx_program_section_exercises_section_id ON program_section_exercises(section_id);
