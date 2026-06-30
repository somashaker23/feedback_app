from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from models import FeedbackInput
from database import init_db, upsert_feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Farewell Feedback", lifespan=lifespan)


@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackInput):
    try:
        await upsert_feedback(feedback.model_dump())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Must come last — serves all of dist/ (avatar.png, assets/*, etc.)
# html=True makes it fall back to index.html for any path with no matching file.
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Farewell Feedback App on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
