"""
Life One API: profile-scoped programs, exercise history, AI settings, health-coach chat.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, profiles, programs, exercise_history, context, ai_settings, chat, coach, foods, diets, meals


def _cors_origins() -> list[str]:
    default = ["http://localhost:5173", "http://127.0.0.1:5173"]
    extra = os.environ.get("CORS_ORIGINS")
    if not extra:
        return default
    return default + [s.strip() for s in extra.split(",") if s.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    # shutdown if needed


app = FastAPI(title="Life One API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(programs.router)
app.include_router(exercise_history.router)
app.include_router(context.router)
app.include_router(ai_settings.router)
app.include_router(chat.router)
app.include_router(coach.router)
app.include_router(foods.router)
app.include_router(diets.router)
app.include_router(meals.router)


@app.get("/")
def root():
    return {"service": "Life One API", "docs": "/docs"}
