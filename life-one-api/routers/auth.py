"""
Auth: register (name + password), login, me. JWT-based; get_current_profile for protected routes.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_connection

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get("LIFE_ONE_JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

try:
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
except ImportError:
    pwd_ctx = None


def _hash_password(password: str) -> str:
    if not pwd_ctx:
        raise RuntimeError("passlib not installed; pip install passlib[bcrypt]")
    # bcrypt truncates at 72 bytes; passlib/newer bcrypt can raise. Truncate to 72 bytes.
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        password = pwd_bytes[:72].decode("utf-8", errors="ignore")
    return pwd_ctx.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    if not pwd_ctx:
        return False
    pwd_bytes = plain.encode("utf-8")
    if len(pwd_bytes) > 72:
        plain = pwd_bytes[:72].decode("utf-8", errors="ignore")
    return pwd_ctx.verify(plain, hashed)


def _create_token(profile_id: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": profile_id,
        "name": name,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> tuple[str, str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        profile_id = payload.get("sub")
        name = payload.get("name")
        if not profile_id or not name:
            raise HTTPException(status_code=401, detail="Invalid token")
        return (str(profile_id), str(name))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_profile(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> tuple[str, str]:
    """Dependency: require Authorization Bearer token; return (profile_id, name)."""
    if not credentials or credentials.scheme != "Bearer":
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    return _decode_token(credentials.credentials)


@router.post("/register")
def register(body: dict):
    """Create profile with name + password; return token and profile."""
    name = (body.get("name") or "").strip()
    password = body.get("password") or ""
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    if not password:
        raise HTTPException(status_code=400, detail="password is required")
    if len(name) > 200:
        raise HTTPException(status_code=400, detail="name too long")

    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM profiles WHERE name = ?", (name,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Profile with this name already exists")
        profile_id = str(uuid.uuid4())
        password_hash = _hash_password(password)
        conn.execute(
            "INSERT INTO profiles (id, name, password_hash) VALUES (?, ?, ?)",
            (profile_id, name, password_hash),
        )
        conn.commit()
        token = _create_token(profile_id, name)
        return {"token": token, "profile": {"id": profile_id, "name": name}}
    finally:
        conn.close()


@router.post("/login")
def login(body: dict):
    """Verify name + password; return token and profile."""
    name = (body.get("name") or "").strip()
    password = body.get("password") or ""
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    if not password:
        raise HTTPException(status_code=400, detail="password is required")

    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, name, password_hash FROM profiles WHERE name = ?",
            (name,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid name or password")
        password_hash = row["password_hash"]
        if not password_hash:
            raise HTTPException(status_code=401, detail="Profile has no password set")
        if not _verify_password(password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid name or password")
        profile_id = row["id"]
        profile_name = row["name"]
        token = _create_token(profile_id, profile_name)
        return {"token": token, "profile": {"id": profile_id, "name": profile_name}}
    finally:
        conn.close()


@router.get("/me")
def me(current: tuple[str, str] = Depends(get_current_profile)):
    """Return current profile from JWT."""
    profile_id, name = current
    return {"profile_id": profile_id, "name": name}


def require_profile_match(
    profile_name: str,  # from path; not used for auth (authorize by JWT profile_id only)
    current: tuple[str, str] = Depends(get_current_profile),
) -> str:
    """Dependency: require current user; return profile_id. Authorize by JWT profile_id only; URL profile_name is ignored (no 403 on name mismatch)."""
    profile_id, _name = current
    print(f"[auth] require_profile_match: profile_id={profile_id[:8]}... path_profile_name={profile_name[:20] if profile_name else ''}...")
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id FROM profiles WHERE id = ?", (profile_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return row["id"]
    finally:
        conn.close()
