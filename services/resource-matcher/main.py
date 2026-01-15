from fastapi import FastAPI, HTTPException
from db import database

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
