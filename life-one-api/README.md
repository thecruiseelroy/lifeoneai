# Life One API

Profile-scoped backend for programs, exercise history, AI settings, and health-coach chat (OpenRouter).

## Setup

```bash
cd life-one-api
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## Run the API

**Windows:** Use `start.bat` in this folder, or:

```bash
uvicorn main:app --port 8765
```

(Port 8765 to avoid conflict with other apps.)

**macOS/Linux:** `uvicorn main:app --reload --port 8765`

API: http://localhost:8765  
Docs: http://localhost:8765/docs

## Run the app with the API

1. Start the API (above) on port 8765.
2. In another terminal, start the Vite app:

   ```bash
   cd life-one-app
   npm run dev
   ```

3. Open http://localhost:5173. The app will call the API at `http://localhost:8765` (configure in the app’s API client).

CORS allows `http://localhost:5173` and `http://127.0.0.1:5173` by default.

## Production (lifeoneai.com)

When the frontend is served from `https://lifeoneai.com`, the API must allow that origin. **On the API host** (Render, Railway, VPS, etc.), set this env var:

```bash
CORS_ORIGINS=https://lifeoneai.com,https://www.lifeoneai.com
```

(Comma-separated list; no spaces after commas.) The frontend must be built with `VITE_API_URL` set to this API’s public URL (see life-one-app README).

### Deploy to PaaS (Render, Railway, Fly.io)

- **Render:** Connect this repo; use `render.yaml` or set build command `pip install -r requirements.txt` and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `CORS_ORIGINS` in the Render dashboard.
- **Railway / Heroku:** Use the **Procfile** (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`). Set `CORS_ORIGINS` in the service env.
- **Docker:** `Dockerfile` is included. Build and run with `CORS_ORIGINS` passed as an env var.

## Environment (optional)

- **OPENROUTER_ADMIN_API_KEY** — Master default OpenRouter API key. Used when a user hasn’t set their own in Settings (AI / OpenRouter). Set this on the server (e.g. Render dashboard) so the coach works out of the box; users can still override with their own key in the app. Never commit keys to the repo.

## Database

SQLite file: `life_one.db` in the API directory (override with env `LIFE_ONE_DB`).  
Schema is applied on startup from `schema/*.sql`.

### Persisting the database on Render

**Render free tier uses an ephemeral filesystem:** the DB file is wiped on redeploy or when the service restarts. So accounts and data disappear after a restart. The backend is saving profiles correctly; the host is not persisting them.

To keep profiles and data:

1. **Paid instance + persistent disk (recommended for SQLite)**  
   In the Render dashboard: add a **Disk** to your web service, set a mount path (e.g. `/data`). Then set an env var:  
   `LIFE_ONE_DB=/data/life_one.db`  
   so the DB lives on the persistent disk and survives redeploys.

2. **Or use a managed database**  
   Use Render Postgres (or another hosted DB) and switch the app to that backend (requires code changes to use Postgres instead of SQLite).

Until you add a persistent disk or external DB, users will need to **Register** again after each deploy or restart if login says "Invalid name or password" or "Profile not found".

## Endpoints

- **Profiles**: `GET/POST /api/profiles`, `GET /api/profiles/{name}`
- **Programs**: `GET/POST/PUT/DELETE /api/profiles/{name}/programs`, sections and exercises sub-routes
- **Workout logs**: `GET/POST /api/profiles/{name}/workout-logs`, `POST/PUT .../workout-logs/sets`
- **Context**: `GET /api/profiles/{name}/context` (LLM-ready summary)
- **AI settings**: `GET/PUT /api/profiles/{name}/settings/ai`
- **Chat**: `GET /api/profiles/{name}/chat` (history), `POST /api/profiles/{name}/chat` (send message)
