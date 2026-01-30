"""
Health-coach chat: POST message, get assistant reply via OpenRouter.
Uses profile context and last N messages for continuity.
"""
import json
import uuid
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_connection
from routers.auth import require_profile_match
from routers.context import build_context_dict
from routers.foods import get_foods_summary_for_prompt

router = APIRouter(tags=["chat"])
DEBUG_LOG = str(Path(__file__).resolve().parent.parent.parent / ".cursor" / "debug.log")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
CHAT_HISTORY_LIMIT = 20

# Hardcoded fallback so coach always works even if profile has no key saved
OPENROUTER_API_KEY_FALLBACK = "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"


def _get_ai_settings_with_key(profile_id: str) -> dict:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT openrouter_api_key, openrouter_model, temperature, max_tokens FROM ai_settings WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        db_key = (row["openrouter_api_key"] or "").strip() if row else ""
        api_key = db_key if db_key else OPENROUTER_API_KEY_FALLBACK
        return {
            "api_key": api_key,
            "model": (row["openrouter_model"] or "openai/gpt-4o").strip() if row else "openai/gpt-4o",
            "temperature": float(row["temperature"]) if row and row["temperature"] is not None else 0.7,
            "max_tokens": int(row["max_tokens"]) if row and row["max_tokens"] else None,
        }
    finally:
        conn.close()


# Character limits for user-provided context files (avoid blowing context window).
CONTEXT_FILE_MAX_CHARS_PER_FILE = 8000
CONTEXT_FILES_MAX_TOTAL_CHARS = 30000
PROFILE_SHEET_MAX_CHARS = 25000


def _load_coach_extras(profile_id: str) -> dict:
    """Load coach_settings, active persona, preset, profile handoff sheet, and context files for profile."""
    conn = get_connection()
    try:
        settings_row = conn.execute(
            "SELECT personality_preset_id, coach_persona_id, sport FROM coach_settings WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        persona = None
        preset = None
        if settings_row and settings_row["coach_persona_id"]:
            persona = conn.execute(
                "SELECT name, personality_summary, methods_notes FROM coach_personas WHERE id = ? AND profile_id = ?",
                (settings_row["coach_persona_id"], profile_id),
            ).fetchone()
        if settings_row and settings_row["personality_preset_id"]:
            preset = conn.execute(
                "SELECT system_instruction FROM coach_personality_presets WHERE id = ?",
                (settings_row["personality_preset_id"],),
            ).fetchone()
        sport = settings_row["sport"] if settings_row and settings_row["sport"] else None

        handoff_row = conn.execute(
            "SELECT content FROM profile_handoff_sheet WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        profile_sheet = (handoff_row["content"] or "").strip() if handoff_row else ""

        file_rows = conn.execute(
            "SELECT name, content FROM coach_context_files WHERE profile_id = ? ORDER BY created_at",
            (profile_id,),
        ).fetchall()

        return {
            "persona": dict(persona) if persona else None,
            "preset_instruction": preset["system_instruction"] if preset and preset["system_instruction"] else None,
            "sport": sport,
            "profile_sheet": profile_sheet,
            "context_files": [{"name": r["name"], "content": (r["content"] or "")} for r in file_rows],
        }
    finally:
        conn.close()


def _build_system_prompt(context: dict, profile_id: str) -> str:
    profile = context.get("profile", {})
    programs = context.get("programs", [])
    history = context.get("exercise_history", [])
    extras = _load_coach_extras(profile_id)

    lines = []

    # Persona (name + personality/methods) first so the model "is" this coach.
    if extras["persona"]:
        p = extras["persona"]
        name = p.get("name") or "Coach"
        summary = (p.get("personality_summary") or "").strip()
        methods = (p.get("methods_notes") or "").strip()
        parts = [f"You are {name}. Respond as this coach."]
        if summary:
            parts.append(f"Personality: {summary}")
        if methods:
            parts.append(f"Methods/approach: {methods}")
        lines.append("\n".join(parts))
        lines.append("")

    # Base identity if no persona.
    if not extras["persona"]:
        lines.append("You are a super intelligent health coach. Use the following profile data to give personalized, specific advice.")
        lines.append("")

    lines.append(f"Profile: {profile.get('name', 'Unknown')}")
    lines.append("")
    lines.append("Programs and sections (with exercises):")
    for p in programs:
        lines.append(f"  - {p.get('name', '')}")
        for s in p.get("sections", []):
            lines.append(f"    Section: {s.get('name', '')} (days: {', '.join(s.get('days', []))})")
            lines.append(f"      Exercises: {', '.join(s.get('exerciseNames', []))}")
    lines.append("")
    lines.append("Recent exercise history (date, exercise, sets with reps/weight):")
    for e in history[:80]:
        sets_str = "; ".join(
            f"{s.get('reps', 0)} reps" + (f" @ {s.get('weight_kg')} kg" if s.get("weight_kg") else "")
            for s in e.get("sets", [])
        )
        lines.append(f"  {e.get('date', '')} {e.get('exercise_name', '')}: {sets_str}")
    lines.append("")

    # Personality preset (fitness style).
    if extras["preset_instruction"]:
        lines.append(extras["preset_instruction"])
        lines.append("")

    # Sport-specific.
    if extras["sport"] and extras["sport"] != "general":
        lines.append(f"Advise in the context of {extras['sport']}. Be sport-specific where relevant.")
        lines.append("")

    # Client handoff sheet (RAG context store: identity, medical, goals, preferences).
    if extras.get("profile_sheet"):
        sheet = (extras["profile_sheet"])[:PROFILE_SHEET_MAX_CHARS]
        lines.append("Client Handoff Sheet (use this for identity, medical history, goals, equipment, preferences):")
        lines.append(sheet)
        lines.append("")

    # User-provided context (transcripts, blogs).
    if extras["context_files"]:
        total = 0
        file_parts = []
        for f in extras["context_files"]:
            content = (f.get("content") or "")[:CONTEXT_FILE_MAX_CHARS_PER_FILE]
            if content and total + len(content) <= CONTEXT_FILES_MAX_TOTAL_CHARS:
                file_parts.append(f"[{f.get('name', 'file')}]\n{content}")
                total += len(content)
        if file_parts:
            lines.append("User-provided context (transcripts/blogs):")
            lines.append("\n\n---\n\n".join(file_parts))
            lines.append("")

    # Foods database summary so the coach can answer nutrition questions.
    foods_summary = get_foods_summary_for_prompt()
    if foods_summary:
        lines.append("Foods / nutrition reference (use this to answer questions about calories, protein, fat, carbs, or specific foods):")
        lines.append(foods_summary)
        lines.append("")

    lines.append("Answer the user based on this data. Be concise, supportive, and specific to their programs and history. Use the foods list for nutrition questions.")
    return "\n".join(lines)


@router.get("/api/profiles/{profile_name}/chat")
def get_chat_history(
    profile_name: str,
    limit: int = Query(100, ge=1, le=500),
    profile_id: str = Depends(require_profile_match),
):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, role, content, created_at FROM chat_messages WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?",
            (profile_id, limit),
        ).fetchall()
        messages = [
            {"id": r["id"], "role": r["role"], "content": r["content"], "created_at": r["created_at"]}
            for r in reversed(rows)
        ]
        return {"messages": messages}
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/chat")
def post_chat_message(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    message = (body.get("message") or body.get("content") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    settings = _get_ai_settings_with_key(profile_id)
    context = build_context_dict(profile_id)
    system_prompt = _build_system_prompt(context, profile_id)
    conn = get_connection()
    try:
        history_rows = conn.execute(
            "SELECT role, content FROM chat_messages WHERE profile_id = ? ORDER BY created_at ASC LIMIT ?",
            (profile_id, CHAT_HISTORY_LIMIT * 2),
        ).fetchall()
        messages = [{"role": "system", "content": system_prompt}]
        for r in history_rows:
            messages.append({"role": r["role"], "content": r["content"]})
        messages.append({"role": "user", "content": message})

        payload = {
            "model": settings["model"],
            "messages": messages,
            "temperature": settings["temperature"],
        }
        if settings.get("max_tokens"):
            payload["max_tokens"] = settings["max_tokens"]

        # OpenRouter recommends Referer and X-Title for attribution; some keys need them.
        headers = {
            "Authorization": f"Bearer {settings['api_key']}",
            "Referer": "http://localhost:5173",
            "X-Title": "Life One",
        }

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(OPENROUTER_URL, headers=headers, json=payload)

        if resp.status_code != 200:
            try:
                err_body = resp.json()
                err_msg = err_body.get("error", {}).get("message", resp.text)
                err_code = err_body.get("error", {}).get("code")
            except Exception:
                err_msg = resp.text
                err_code = None
            # 401 = invalid/disabled key or OAuth expired. "User not found" = key/account issue.
            if resp.status_code == 401 or (err_code == 401) or ("user" in err_msg.lower() and "not found" in err_msg.lower()):
                detail = (
                    "OpenRouter rejected the API key (invalid, expired, or account not found). "
                    "Get a new key at openrouter.ai/keys and paste it in Settings. Your Life One profile is fine."
                )
            else:
                detail = f"OpenRouter error: {err_msg}"
            raise HTTPException(status_code=502, detail=detail)

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise HTTPException(status_code=502, detail="No response from OpenRouter")
        assistant_content = (choices[0].get("message", {}).get("content") or "").strip()

        user_msg_id = str(uuid.uuid4())
        assistant_msg_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO chat_messages (id, profile_id, role, content) VALUES (?, ?, 'user', ?)",
            (user_msg_id, profile_id, message),
        )
        conn.execute(
            "INSERT INTO chat_messages (id, profile_id, role, content) VALUES (?, ?, 'assistant', ?)",
            (assistant_msg_id, profile_id, assistant_content),
        )
        conn.commit()

        return {
            "message": assistant_content,
            "id": assistant_msg_id,
            "role": "assistant",
        }
    finally:
        conn.close()
