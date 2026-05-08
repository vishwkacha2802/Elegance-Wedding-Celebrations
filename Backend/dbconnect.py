import os
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient


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

# Configure the MongoDB connection used by the backend.
# Keep module-level constants together so related rules stay easy to maintain.

MONGO_URL = str(os.getenv("MONGO_URL", "")).strip()
MONGO_DB = str(os.getenv("MONGO_DB", "elegance_db")).strip() or "elegance_db"

if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not configured.")

# Create a single async MongoDB client for the application.

client = AsyncIOMotorClient(MONGO_URL)

# Expose the shared database handle used across controllers.

db = client[MONGO_DB]
