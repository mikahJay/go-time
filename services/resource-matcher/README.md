# resource-matcher

Minimal FastAPI service that connects to the same Postgres used by `services/resource-server`.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to the Postgres connection string used by `services/resource-server`.

2. Create virtualenv and install:

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

3. Run locally:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. Health check will attempt a simple `SELECT 1` against the configured DB:

`GET /health` → returns `{ "status": "ok" }` when DB accessible.