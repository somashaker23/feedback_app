# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Render Deployment

Push to a GitHub repo, then create a new Render **Web Service** pointing at it. Render auto-detects `render.yaml` and `Dockerfile`.

1. In the Render dashboard, add the `DATABASE_URL` environment variable (Neon connection string).
2. Render builds the Docker image (multi-stage: Node → React build, then Python runtime) and deploys.
3. The app is served at `https://<service>.onrender.com`.

The `render.yaml` declares the service as `runtime: docker`. The `Dockerfile` handles both the React build and the Python server in one image — no separate build step needed on Render.

## Setup (local)

```bash
# Install Python dependencies
uv sync

# Install frontend dependencies
cd frontend && npm install
```

Create a `.env` file in the project root before running:
```
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/<db>?sslmode=require
```

## Commands

```bash
# Production: build React, then serve everything from FastAPI on port 8000
cd frontend && npm run build
uvicorn main:app --host 0.0.0.0 --port 8000
```

```bash
# Dev mode: hot reload for both layers
uvicorn main:app --host 0.0.0.0 --port 8000 --reload   # terminal 1
cd frontend && npm run dev                               # terminal 2 (port 5173)
```

In dev mode, browse at `http://localhost:5173` — Vite proxies `/api/*` to FastAPI.

## Architecture

React SPA + FastAPI single-service app for farewell feedback collection.

```
Browser → GET /        → FastAPI serves frontend/dist/index.html
Browser → POST /api/*  → FastAPI route handlers → Neon DB (PostgreSQL)
```

FastAPI mounts `frontend/dist/assets` as static files and uses a catch-all `GET /{path}` to return `index.html` for SPA routing. Same origin means no CORS configuration needed.

**Backend files:**
- `models.py` — `FeedbackInput` Pydantic model with a `@model_validator` enforcing that ratings 1–2 require a comment
- `database.py` — SQLAlchemy async engine, `Feedback` ORM table, `init_db()` (creates table on startup), `insert_feedback()`
- `main.py` — FastAPI app; lifespan calls `init_db()`, one POST route, static file mount, SPA catch-all

**Frontend (`frontend/src/`):**
- `App.jsx` — form state, validation, fetch submit, success state
- `components/ScaleQuestion.jsx` — 4-point radio with behavioral anchors; conditionally shows mandatory/optional textarea based on score
- `components/EnergySlider.jsx` — range slider 1–4 (Drained → Energized), no text area
- `components/TextQuestion.jsx` — plain labeled textarea (Q4, Q5)

**Five questions:**
- Q1 Reliability — 4-point scale, comment mandatory if ≤ 2
- Q2 Receptivity — 4-point scale, comment mandatory if ≤ 2
- Q3 Energy — slider only, no text
- Q4 Blind Spot — open text, always required
- Q5 Future Skill — open text, always required

**Database:** Neon DB (PostgreSQL). `DATABASE_URL` loaded from `.env`. Table `feedback` is created automatically on first startup. No read endpoint — query Neon console to inspect submissions.

**Customization:** Update the `<h2>` in `frontend/src/App.jsx` (line ~100) — it contains the placeholder `Leave a note for Your Name`.

**Network sharing:** FastAPI binds to `0.0.0.0`; colleagues on the same LAN reach the app at `http://<host-ip>:8000`.
