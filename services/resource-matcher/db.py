import os
import json
import base64
from databases import Database
from dotenv import load_dotenv

load_dotenv()

# Prefer explicit DATABASE_URL if provided (useful for local tunnel/dev)
DATABASE_URL = os.getenv("DATABASE_URL")

def _build_from_secret_or_env():
    secret_arn = os.getenv("DATABASE_SECRET_ARN")
    db_user = os.getenv("DB_USER", os.getenv("PGUSER", "postgres"))
    db_name = os.getenv("DB_NAME", os.getenv("PGDATABASE", "resources_public"))
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "5432")
    password = None

    if secret_arn:
        import boto3
        region = os.getenv("AWS_REGION") or None
        client = boto3.client("secretsmanager", region_name=region)
        resp = client.get_secret_value(SecretId=secret_arn)
        if "SecretString" in resp and resp["SecretString"]:
            secret_str = resp["SecretString"]
            try:
                secret_json = json.loads(secret_str)
            except Exception:
                secret_json = None

            if secret_json:
                password = secret_json.get("password") or secret_json.get("Password")
                db_user = secret_json.get("username") or secret_json.get("user") or db_user
                db_host = secret_json.get("host") or db_host
                db_port = secret_json.get("port") or db_port
                db_name = secret_json.get("dbname") or secret_json.get("database") or db_name
            else:
                # secret string is plain password
                password = secret_str
        elif "SecretBinary" in resp and resp["SecretBinary"]:
            password = base64.b64decode(resp["SecretBinary"]).decode()

    if not password:
        password = os.getenv("DB_PASSWORD") or os.getenv("PGPASSWORD")

    if not db_host:
        db_host = os.getenv("HOST")

    if not db_host:
        raise RuntimeError("Database host not configured (set DATABASE_URL or DATABASE_SECRET_ARN and DB_HOST)")

    if not password:
        raise RuntimeError("Database password not available from Secrets Manager or env (DB_PASSWORD)")

    return f"postgres://{db_user}:{password}@{db_host}:{db_port}/{db_name}"


if not DATABASE_URL:
    DATABASE_URL = _build_from_secret_or_env()

database = Database(DATABASE_URL)


def get_sync_connection():
    """Return a synchronous psycopg2 connection using the resolved DATABASE_URL."""
    import psycopg2

    dsn = DATABASE_URL
    # strip surrounding quotes if present
    if isinstance(dsn, str) and ((dsn.startswith('"') and dsn.endswith('"')) or (dsn.startswith("'") and dsn.endswith("'"))):
        dsn = dsn[1:-1]

    return psycopg2.connect(dsn)
