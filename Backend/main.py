import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from controller.ratings_utils import ensure_rating_indexes
from controller.usercontroller import ensure_favorite_indexes
from controller.performance_utils import ensure_performance_indexes


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

from router.authrouter import AuthRouter
from router.adminrouter import AdminRouter
from router.userrouter import UserRouter
from router.vendorsrouter import VendorsRouter
from router.vendorrouter import VendorRouter
from router.ratingsrouter import RatingsRouter
from router.contactrouter import ContactRouter

# Create the main FastAPI application instance for the backend.

app = FastAPI()

# Allow the local frontend origins that are used during development.

local_dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Apply the shared CORS middleware configuration for local clients.

app.add_middleware(
    CORSMiddleware,
    allow_origins=local_dev_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress JSON/API responses so large lists and dashboard payloads transfer faster.

app.add_middleware(GZipMiddleware, minimum_size=1024)


# Add cache headers for immutable static assets when the backend serves built files.

@app.middleware("http")
async def add_performance_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path

    if path.startswith("/assets/"):
        response.headers.setdefault(
            "Cache-Control",
            "public, max-age=31536000, immutable",
        )
    elif path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")

    return response

# Register each feature router on the shared FastAPI application.

app.include_router(AuthRouter)
app.include_router(AdminRouter)
app.include_router(UserRouter)
app.include_router(VendorsRouter)
app.include_router(VendorRouter)
app.include_router(RatingsRouter)
app.include_router(ContactRouter)


# Create the required database indexes when the API boots up.

@app.on_event("startup")
async def startup_event():
    await ensure_rating_indexes()
    await ensure_favorite_indexes()
    await ensure_performance_indexes()
