import os
import asyncio
from fastapi import FastAPI, HTTPException
from db import database, get_sync_connection
from matcher import ResourceMatcher

app = FastAPI(title="resource-matcher")


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/")
async def root():
    return {"message": "resource-matcher hello"}


@app.get("/health")
async def health():
    try:
        row = await database.fetch_one(query="SELECT 1 AS value")
        if row and row["value"] == 1:
            return {"status": "ok"}
        raise Exception("unexpected response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/match/{need_id}")
async def match_need(need_id: int):
    """Run the synchronous matcher.match in a threadpool and return wrapped JSON."""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    # create a short-lived sync DB connection for the matcher
    try:
        conn = get_sync_connection()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to get db connection: {e}")

    matcher = ResourceMatcher(conn, anthropic_key)

    try:
        # run blocking match in threadpool
        matches = await asyncio.to_thread(matcher.match, need_id)
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            conn.close()
        except Exception:
            pass



@app.post("/match-test/{need_id}")
async def match_test(need_id: int):
    """Test-only route that returns a canned match result without DB or LLM calls."""
    sample = [
        {
            "id": "test-resource-1",
            "feasibility": 85,
            "explanation": "Placeholder match used for local testing",
            "similarity": 0.92,
        }
    ]
    return {"matches": sample, "need_id": need_id}
