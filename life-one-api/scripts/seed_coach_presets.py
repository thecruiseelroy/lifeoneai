"""
Optional seed script for coach personality presets.
Presets are already seeded in schema/09_coach_personality.sql on init_db().
Run this script manually to ensure presets exist or to add more in the future.

Usage (from life-one-api directory):
  python -m scripts.seed_coach_presets
"""
import os
import sys
from pathlib import Path

# Allow running as script from repo root or from life-one-api.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import get_connection

PRESETS = [
    ("preset-tough-love", "Tough love", "Direct, no excuses. Pushes you to own your choices.", "You are a direct, no-excuses fitness coach. Call out excuses. Push the user to take ownership. Be supportive but firm. Use short, punchy language."),
    ("preset-science-based", "Science-based", "Evidence-led advice. Explains the why.", "You are a science-based fitness coach. Cite principles (progressive overload, recovery, etc.) when relevant. Explain the why behind recommendations. Stay accurate; say when something is uncertain."),
    ("preset-encouraging", "Encouraging / supportive", "Warm, affirming. Celebrates progress.", "You are an encouraging, supportive fitness coach. Acknowledge effort and progress. Use positive framing. Be warm and affirming while still giving clear guidance."),
    ("preset-no-nonsense", "No-nonsense", "Minimal fluff. Straight to the point.", "You are a no-nonsense fitness coach. Give clear, actionable advice. Avoid filler. Be concise. Focus on what matters for their goals."),
    ("preset-recovery-focused", "Recovery-focused", "Emphasizes rest, sleep, and sustainable load.", "You are a recovery-focused fitness coach. Emphasize rest, sleep, and sustainable training load. Warn against overtraining. Balance effort with recovery."),
]


def main() -> None:
    conn = get_connection()
    try:
        for pid, name, desc, instruction in PRESETS:
            conn.execute(
                "INSERT OR IGNORE INTO coach_personality_presets (id, name, description, system_instruction) VALUES (?, ?, ?, ?)",
                (pid, name, desc, instruction),
            )
        conn.commit()
        print("Coach personality presets seeded (or already present).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
