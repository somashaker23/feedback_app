# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
uv sync

# Run the application
python main.py
# or equivalently
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server starts on `http://0.0.0.0:8000`. No build, test, or lint tooling is configured.

## Architecture

This is a single-file FastAPI application (`main.py`) — a farewell feedback collection tool. Everything lives in one file: backend routes, Pydantic model, and the HTML/CSS/JS frontend embedded as a Python string.

**Data flow:**
1. `GET /` returns the embedded HTML frontend
2. User fills out the form (star rating + comment + optional name)
3. `POST /api/feedback` validates the payload via `FeedbackInput` and appends to `feedback_data.json`

**Key sections of `main.py`:**
- Lines 10–13: `FeedbackInput` Pydantic model (rating 1–5, comment 2–1000 chars, optional name)
- Lines 20–230: HTML/CSS/JS frontend as a string constant
- Lines 235–257: The two API routes
- Line 261+: `__main__` entry point

**Storage:** `feedback_data.json` is created automatically on first submission. It holds a flat list of feedback objects. There is no database — persistence is local file only. There is no read endpoint; inspect submissions by opening `feedback_data.json` directly.

**Customization:** Before sharing, update the `<h2>` tag on line 149 of `HTML_TEMPLATE` — it contains the placeholder `Leave a note for Your Name`.

**Network sharing:** The app binds to `0.0.0.0` so colleagues on the same LAN can reach it at `http://<host-ip>:8000`. The startup message prints a reminder to substitute the actual IP.
