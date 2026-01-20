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
# Windows PowerShell (recommended)
cd services\resource-matcher
.venv\Scripts\Activate.ps1
.venv\Scripts\python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Unix / macOS
cd services/resource-matcher
source .venv/bin/activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The new match endpoint is:
- `POST /match/{need_id}` — runs the synchronous matching pipeline for the given `need_id` and returns `{ "matches": [...] }`.

Test-only route (no DB/LLM required):
- `POST /match-test/{need_id}` — returns a canned `{ "matches": [...] }` useful for local testing.

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

- If the app fails during startup with a DNS/socket error, your `DATABASE_URL` host may not be reachable from your machine. For local development you can:
	- Run a local Postgres instance (Docker) and point `DATABASE_URL` at `127.0.0.1:5432`, or
	- Use AWS SSM port forwarding to tunnel to the RDS instance and set `DATABASE_URL` to `localhost:5432`.

Example Docker command (quick local Postgres):
```powershell
docker run --name rm-postgres -e POSTGRES_PASSWORD=devpw -e POSTGRES_USER=postgres -e POSTGRES_DB=resources_public -p 5432:5432 -d postgres:15
```

Example SSM port-forward (replace instance id/profile as appropriate):
```powershell
aws ssm start-session --target i-07f3fc0cd01b8a1a2 --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["5432"],"localPortNumber":["5432"]}' --profile dev
```
