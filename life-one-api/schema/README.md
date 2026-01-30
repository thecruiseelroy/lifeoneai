# Life One schema

One `.sql` file per domain, applied in order on database init. All tables use full, self-describing column names (snake_case) for LLM-friendly dumps.

## Tables

| File | Table | Purpose |
|------|--------|--------|
| 01_profiles.sql | profiles | One row per user profile (id, name unique, created_at, updated_at). |
| 02_programs.sql | programs | Programs owned by profile (id, profile_id, name). |
| 03_program_sections.sql | program_sections | Sections within a program (id, program_id, name, description, days JSON). |
| 04_program_section_exercises.sql | program_section_exercises | Ordered exercises per section (section_id, exercise_name, sort_order). |
| 05_exercise_history.sql | exercise_history | One row per log day per exercise (id, profile_id, exercise_name, date). |
| 06_workout_sets.sql | workout_sets | Sets for a history entry (id, exercise_history_id, set_index, reps, weight_kg, note). |
| 07_ai_settings.sql | ai_settings | Per-profile OpenRouter settings (profile_id, openrouter_api_key, model, temperature, max_tokens). API key never returned to frontend. |
| 08_chat_messages.sql | chat_messages | Coach conversation (id, profile_id, role, content, created_at). |
| 09_coach_personality.sql | coach_* | Coach presets, personas, settings. |
| 10_coach_context_files.sql | coach_context_files | User-provided context (transcripts, blogs). |
| 13_profile_handoff_sheet.sql | profile_handoff_sheet | One RAG context doc per profile (Client Handoff Sheet). Coach reads this in chat. |
| 11_nutrients.sql | nutrients | Reference nutrients: name, type, rda_ug, tui_ug, required, wiki_url. Seeded via scripts/seed_nutrients.py. |
| 12_foods.sql | foods | Foods with name, usda_id, fat, calories, proteins, carbohydrates, serving, nutrients (JSON). Seeded via scripts/seed_foods.py. |

## Relationships

- profiles ← programs (profile_id)
- programs ← program_sections (program_id)
- program_sections ← program_section_exercises (section_id)
- profiles ← exercise_history (profile_id)
- exercise_history ← workout_sets (exercise_history_id)
- profiles ← ai_settings (profile_id)
- profiles ← chat_messages (profile_id)

## LLM context export

`GET /api/profiles/{profile_name}/context` returns a single JSON blob with:

- `profile`: name, id
- `programs`: each program with sections and ordered exercise names
- `exercise_history`: recent entries (exercise_name, date, sets with reps, weight_kg, note)

Use this as system/context for the health-coach chat or for external LLM tools (e.g. Gemini).
