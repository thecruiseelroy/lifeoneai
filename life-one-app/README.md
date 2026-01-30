# Life One – Exercise Library

Ultra-modern, dark-themed tile-based exercise library built with React, Vite, TypeScript, and Lucide icons. Consumes `exercises.json` from the parent repo.

## Setup

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (e.g. http://localhost:5173).

### Profiles (programs, coach, settings)

Profiles are stored in the **Life One API** backend. Start it first so Save profile and the list work:

```bash
# From repo root
cd life-one-api
start.bat
# Or: .venv\Scripts\activate && uvicorn main:app --port 8765
```

Keep that running, then run `npm run dev` in life-one-app. The app talks to http://localhost:8765 by default.

## Build

```bash
npm run build
npm run preview
```

## Production (lifeoneai.com)

The site on Hostinger is **static** (HTML/JS/CSS). The **backend** (life-one-api) must run somewhere reachable from the internet.

1. **Host the API** (e.g. subdomain `api.lifeoneai.com` on Hostinger, or Railway / Render / Fly.io). Ensure it listens on a public URL and uses HTTPS.
2. **Allow the frontend origin** in the API’s CORS (see life-one-api README / `CORS_ORIGINS`).
3. **Set the API URL for the frontend build:**
   - Copy `.env.production.example` to `.env.production`.
   - Set `VITE_API_URL=https://api.lifeoneai.com` (or your API URL).
4. **Rebuild and re-upload:**
   ```bash
   npm run build
   ```
   Upload the **contents** of `dist/` to your Hostinger document root (overwrite existing files).

Until the API is deployed and the frontend is rebuilt with `VITE_API_URL`, the live site will show “Server not reachable” because the built app still calls `http://localhost:8765`.

## Data

Exercise data is loaded from `public/exercises.json` (copied from `../exercises-main/exercises.json`). Filters and search are reflected in the URL query params for sharing and back/forward navigation.
