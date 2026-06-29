from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from models import FeedbackInput
from database import init_db, insert_feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Farewell Feedback", lifespan=lifespan)

app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")


@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackInput):
    try:
        await insert_feedback(feedback.model_dump())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    return FileResponse("frontend/dist/index.html")


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Farewell Feedback App on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
