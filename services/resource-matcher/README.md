# resource-matcher

Minimal FastAPI service that connects to the same Postgres used by `services/resource-server`.

**Prerequisites:** Python 3.11+, Docker (optional), AWS credentials configured for Secrets Manager when using `DATABASE_SECRET_ARN`.

**1) Configure environment**

- Copy `.env.example` to `.env` and edit values, or export env vars directly. Key vars:
	- `DATABASE_URL` — full Postgres URL (or)
	- `DATABASE_SECRET_ARN` — ARN of Secrets Manager secret containing DB credentials (and optionally `AWS_REGION`).
	- `ANTHROPIC_API_KEY` — (optional) for running the matcher against Anthropic.

**2) Build (install deps)**

Windows PowerShell:

```powershell
cd services\resource-matcher
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Unix / macOS:

```bash
cd services/resource-matcher
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**3) Run locally**

Start with uvicorn (development):

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The new match endpoint is:
- `POST /match/{need_id}` — runs the synchronous matching pipeline for the given `need_id` and returns `{ "matches": [...] }`.

Health check:
- `GET /health` — returns `{ "status": "ok" }` when the DB is reachable.

**4) Tests**

Offline unit tests are provided under `services/resource-matcher/tests/` and do not call Anthropic or the real database.

Run tests (after activating the virtualenv):

```bash
pip install pytest
pytest -q services/resource-matcher/tests
```

**5) Notes / troubleshooting**
- If you use `DATABASE_SECRET_ARN`, ensure your AWS credentials/profile and `AWS_REGION` are available in the environment so `boto3` can retrieve secrets.
- The matcher uses a synchronous `psycopg2` connection executed inside a threadpool — this keeps the FastAPI app responsive.
- To run in Docker, build the image from the `Dockerfile` and supply env vars or a mounted `.env` file.
