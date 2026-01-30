"""
AI/OpenRouter settings per profile. API key is never returned to frontend.
"""
import json
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from database import get_connection
from routers.auth import require_profile_match

router = APIRouter(tags=["ai_settings"])
DEBUG_LOG = str(Path(__file__).resolve().parent.parent.parent / ".cursor" / "debug.log")


@router.get("/api/profiles/{profile_name}/settings/ai")
def get_ai_settings(profile_name: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT openrouter_model, temperature, max_tokens, created_at, updated_at FROM ai_settings WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        if not row:
            return {
                "openrouter_model": "openai/gpt-4o",
                "temperature": 0.7,
                "max_tokens": None,
                "has_api_key": False,
            }
        return {
            "openrouter_model": row["openrouter_model"] or "openai/gpt-4o",
            "temperature": row["temperature"] if row["temperature"] is not None else 0.7,
            "max_tokens": row["max_tokens"],
            "has_api_key": conn.execute(
                "SELECT 1 FROM ai_settings WHERE profile_id = ? AND openrouter_api_key IS NOT NULL AND openrouter_api_key != ''",
                (profile_id,),
            ).fetchone() is not None,
        }
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/settings/ai")
def put_ai_settings(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    api_key = body.get("openrouter_api_key")
    if api_key is not None:
        api_key = (api_key or "").strip() or None
    # #region agent log
    try:
        with open(DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps({"location": "ai_settings.py:put_ai_settings", "message": "PUT received", "data": {"profile_name": profile_name, "profile_id": profile_id, "body_has_api_key": "openrouter_api_key" in body, "api_key_present_after_strip": api_key is not None}, "hypothesisId": "B"}) + "\n")
    except Exception:
        pass
    # #endregion
    conn = get_connection()
    try:
        model = (body.get("openrouter_model") or body.get("model") or "openai/gpt-4o").strip()
        temperature = body.get("temperature")
        if temperature is None:
            temperature = 0.7
        else:
            temperature = float(temperature)
            temperature = max(0.0, min(2.0, temperature))
        max_tokens = body.get("max_tokens")
        if max_tokens is not None:
            max_tokens = int(max_tokens) if max_tokens else None

        row = conn.execute("SELECT profile_id FROM ai_settings WHERE profile_id = ?", (profile_id,)).fetchone()
        if row:
            branch = "UPDATE_with_key" if api_key is not None else "UPDATE_no_key"
            if api_key is not None:
                conn.execute(
                    "UPDATE ai_settings SET openrouter_api_key = ?, openrouter_model = ?, temperature = ?, max_tokens = ?, updated_at = datetime('now') WHERE profile_id = ?",
                    (api_key, model, temperature, max_tokens, profile_id),
                )
            else:
                conn.execute(
                    "UPDATE ai_settings SET openrouter_model = ?, temperature = ?, max_tokens = ?, updated_at = datetime('now') WHERE profile_id = ?",
                    (model, temperature, max_tokens, profile_id),
                )
        else:
            branch = "INSERT"
            conn.execute(
                "INSERT INTO ai_settings (profile_id, openrouter_api_key, openrouter_model, temperature, max_tokens) VALUES (?, ?, ?, ?, ?)",
                (profile_id, api_key or "", model, temperature, max_tokens),
            )
        conn.commit()
        # #region agent log
        try:
            with open(DEBUG_LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps({"location": "ai_settings.py:put_ai_settings", "message": "after commit", "data": {"branch": branch, "profile_id": profile_id}, "hypothesisId": "B"}) + "\n")
        except Exception:
            pass
        # #endregion
        return get_ai_settings(profile_name)
    finally:
        conn.close()
