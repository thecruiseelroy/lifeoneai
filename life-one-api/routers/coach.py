"""
Coach personality: presets, settings, personas, and context files.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from database import get_connection
from routers.auth import require_profile_match

router = APIRouter(tags=["coach"])

SPORT_OPTIONS = [
    "general",
    "strength",
    "running",
    "crossfit",
    "cycling",
    "swimming",
    "endurance",
]


# --- Presets ---
@router.get("/api/profiles/{profile_name}/coach/presets")
def list_presets(profile_name: str, _profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, description, system_instruction FROM coach_personality_presets ORDER BY name"
        ).fetchall()
        return {
            "presets": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "description": r["description"] or "",
                    "system_instruction": r["system_instruction"] or "",
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


# --- Settings ---
@router.get("/api/profiles/{profile_name}/coach/settings")
def get_coach_settings(profile_name: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT personality_preset_id, coach_persona_id, sport FROM coach_settings WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        return {
            "personality_preset_id": row["personality_preset_id"] if row else None,
            "coach_persona_id": row["coach_persona_id"] if row else None,
            "sport": row["sport"] if row and row["sport"] else None,
            "sport_options": SPORT_OPTIONS,
        }
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/coach/settings")
def put_coach_settings(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    personality_preset_id = body.get("personality_preset_id")
    if personality_preset_id is not None and personality_preset_id == "":
        personality_preset_id = None
    coach_persona_id = body.get("coach_persona_id")
    if coach_persona_id is not None and coach_persona_id == "":
        coach_persona_id = None
    sport = body.get("sport")
    if sport is not None and (sport == "" or sport not in SPORT_OPTIONS):
        sport = None
    conn = get_connection()
    try:
        if coach_persona_id:
            check = conn.execute(
                "SELECT id FROM coach_personas WHERE id = ? AND profile_id = ?",
                (coach_persona_id, profile_id),
            ).fetchone()
            if not check:
                raise HTTPException(status_code=400, detail="Persona not found or not owned by this profile")
        conn.execute(
            """INSERT INTO coach_settings (profile_id, personality_preset_id, coach_persona_id, sport, updated_at)
               VALUES (?, ?, ?, ?, datetime('now'))
               ON CONFLICT(profile_id) DO UPDATE SET
                 personality_preset_id = excluded.personality_preset_id,
                 coach_persona_id = excluded.coach_persona_id,
                 sport = excluded.sport,
                 updated_at = datetime('now')""",
            (profile_id, personality_preset_id, coach_persona_id, sport),
        )
        conn.commit()
        return get_coach_settings(profile_name)
    finally:
        conn.close()


# --- Personas ---
@router.get("/api/profiles/{profile_name}/coach/personas")
def list_personas(profile_name: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, personality_summary, methods_notes, created_at, updated_at FROM coach_personas WHERE profile_id = ? ORDER BY name",
            (profile_id,),
        ).fetchall()
        return {
            "personas": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "personality_summary": r["personality_summary"] or "",
                    "methods_notes": r["methods_notes"] or "",
                    "created_at": r["created_at"],
                    "updated_at": r["updated_at"],
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/coach/personas")
def create_persona(profile_name: str, body: dict, profile_id: str = Depends(require_profile_match)):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    personality_summary = (body.get("personality_summary") or "").strip() or None
    methods_notes = (body.get("methods_notes") or "").strip() or None
    persona_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO coach_personas (id, profile_id, name, personality_summary, methods_notes) VALUES (?, ?, ?, ?, ?)",
            (persona_id, profile_id, name, personality_summary, methods_notes),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, personality_summary, methods_notes, created_at, updated_at FROM coach_personas WHERE id = ?",
            (persona_id,),
        ).fetchone()
        return {
            "id": row["id"],
            "name": row["name"],
            "personality_summary": row["personality_summary"] or "",
            "methods_notes": row["methods_notes"] or "",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/coach/personas/{persona_id}")
def update_persona(profile_name: str, persona_id: str, body: dict, profile_id: str = Depends(require_profile_match)):
    name = (body.get("name") or "").strip() or None
    personality_summary = (body.get("personality_summary") or "").strip() or None
    methods_notes = (body.get("methods_notes") or "").strip() or None
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT name FROM coach_personas WHERE id = ? AND profile_id = ?",
            (persona_id, profile_id),
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Persona not found")
        final_name = name if name else existing["name"]
        cur = conn.execute(
            "UPDATE coach_personas SET name = ?, personality_summary = ?, methods_notes = ?, updated_at = datetime('now') WHERE id = ? AND profile_id = ?",
            (final_name, personality_summary, methods_notes, persona_id, profile_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Persona not found")
        conn.commit()
        row = conn.execute(
            "SELECT id, name, personality_summary, methods_notes, created_at, updated_at FROM coach_personas WHERE id = ?",
            (persona_id,),
        ).fetchone()
        return {
            "id": row["id"],
            "name": row["name"],
            "personality_summary": row["personality_summary"] or "",
            "methods_notes": row["methods_notes"] or "",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    finally:
        conn.close()


@router.delete("/api/profiles/{profile_name}/coach/personas/{persona_id}")
def delete_persona(profile_name: str, persona_id: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        cur = conn.execute("DELETE FROM coach_personas WHERE id = ? AND profile_id = ?", (persona_id, profile_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Persona not found")
        conn.execute(
            "UPDATE coach_settings SET coach_persona_id = NULL, updated_at = datetime('now') WHERE profile_id = ? AND coach_persona_id = ?",
            (profile_id, persona_id),
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


# --- Context files ---
@router.get("/api/profiles/{profile_name}/coach/files")
def list_context_files(profile_name: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, source_type, created_at FROM coach_context_files WHERE profile_id = ? ORDER BY created_at DESC",
            (profile_id,),
        ).fetchall()
        return {
            "files": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "source_type": r["source_type"],
                    "created_at": r["created_at"],
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


@router.post("/api/profiles/{profile_name}/coach/files")
async def create_context_file(
    profile_name: str,
    body: dict | None = None,
    file: UploadFile | None = File(None),
    name_override: str | None = Form(None),
    source_type_form: str | None = Form(None, alias="source_type"),
    profile_id: str = Depends(require_profile_match),
):
    name = None
    content = None
    source_type = "general"

    if file and file.filename:
        name = (name_override or file.filename or "upload").strip() or "upload"
        try:
            content = (await file.read()).decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read file as text: {e}")
        source_type = (source_type_form or (body.get("source_type") if body else None) or "general").strip().lower()
    elif body:
        name = (body.get("name") or "").strip()
        content = body.get("content")
        source_type = (body.get("source_type") or "general").strip().lower()
        if not name:
            raise HTTPException(status_code=400, detail="name is required")
        if content is None:
            raise HTTPException(status_code=400, detail="content is required")
        if not isinstance(content, str):
            content = str(content)
    else:
        raise HTTPException(status_code=400, detail="Provide JSON body (name, content, source_type) or multipart file")

    if source_type not in ("transcript", "blog", "general"):
        source_type = "general"

    file_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO coach_context_files (id, profile_id, name, content, source_type) VALUES (?, ?, ?, ?, ?)",
            (file_id, profile_id, name, content, source_type),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, source_type, created_at FROM coach_context_files WHERE id = ?", (file_id,)
        ).fetchone()
        return {
            "id": row["id"],
            "name": row["name"],
            "source_type": row["source_type"],
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


@router.delete("/api/profiles/{profile_name}/coach/files/{file_id}")
def delete_context_file(profile_name: str, file_id: str, profile_id: str = Depends(require_profile_match)):
    conn = get_connection()
    try:
        cur = conn.execute("DELETE FROM coach_context_files WHERE id = ? AND profile_id = ?", (file_id, profile_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="File not found")
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


# --- Profile handoff sheet (RAG context store for coach) ---
PROFILE_SHEET_MAX_CHARS = 50000


@router.get("/api/profiles/{profile_name}/coach/profile-sheet")
def get_profile_sheet(profile_name: str, profile_id: str = Depends(require_profile_match)):
    """Return the profile handoff sheet content for the coach. One per profile."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT content, updated_at FROM profile_handoff_sheet WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        if not row:
            return {"content": "", "updated_at": None}
        return {
            "content": row["content"] or "",
            "updated_at": row["updated_at"],
        }
    finally:
        conn.close()


@router.put("/api/profiles/{profile_name}/coach/profile-sheet")
async def upsert_profile_sheet(
    profile_name: str,
    file: UploadFile | None = File(None),
    content: str | None = Form(None),
    profile_id: str = Depends(require_profile_match),
):
    """
    Set the profile handoff sheet (RAG context for the coach).
    Send either a file (multipart) or form field 'content'.
    Replaces any existing sheet. Coach reads this when building chat context.
    """
    text = None
    if file and file.filename:
        try:
            raw = await file.read()
            text = raw.decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read file as text: {e}")
    if text is None and content is not None:
        text = content
    if text is None:
        raise HTTPException(
            status_code=400,
            detail="Provide a file upload or form field 'content'",
        )
    if len(text) > PROFILE_SHEET_MAX_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Profile sheet must be at most {PROFILE_SHEET_MAX_CHARS} characters",
        )
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO profile_handoff_sheet (profile_id, content, updated_at)
               VALUES (?, ?, datetime('now'))
               ON CONFLICT(profile_id) DO UPDATE SET content = excluded.content, updated_at = datetime('now')""",
            (profile_id, text),
        )
        conn.commit()
        row = conn.execute(
            "SELECT content, updated_at FROM profile_handoff_sheet WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        return {
            "updated_at": row["updated_at"],
            "length": len(row["content"] or ""),
        }
    finally:
        conn.close()
