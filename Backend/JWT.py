import os
from pathlib import Path
from datetime import datetime, timedelta

from jose import jwt


# Load local environment variables before the rest of the backend starts up.

def load_env_file() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        env_key = key.strip()
        env_value = value.strip().strip('"').strip("'")
        if env_key and env_key not in os.environ:
            os.environ[env_key] = env_value


# Load the local `.env` file before importing modules that depend on environment variables.

load_env_file()

# Keep module-level constants together so related rules stay easy to maintain.

SECRET_KEY = str(os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "").strip()
ALGORITHM = str(os.getenv("JWT_ALGORITHM", "HS256")).strip() or "HS256"

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured.")


# Create a signed JWT token with an expiry timestamp for authenticated sessions.

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# Decode a JWT token and safely return `None` when it is invalid or expired.

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
