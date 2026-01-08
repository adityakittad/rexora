from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import base64

# -------------------- LOGGING --------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Ensure .env is loaded
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# -------------------- ENV VALIDATION --------------------
REQUIRED_ENV_VARS = ["MONGO_URL", "DB_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD", "JWT_SECRET"]
missing = [v for v in REQUIRED_ENV_VARS if not os.environ.get(v)]

if missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].strip().strip('"').strip("'")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"].strip().strip('"').strip("'")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

logger.info("Environment variables loaded successfully")
# DEBUG: show raw reprs of admin env vars to diagnose credential mismatches
logger.info(f"ADMIN_EMAIL repr: {repr(ADMIN_EMAIL)}")
logger.info(f"ADMIN_PASSWORD repr: {repr(ADMIN_PASSWORD)}")

# -------------------- DATABASE --------------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# -------------------- APP --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://rexora.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_router = APIRouter(prefix="/api")

# -------------------- MODELS --------------------
class AdminLogin(BaseModel):
    email: str
    password: str

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    video_data: str
    thumbnail: str = ""
    category: str = "Project"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "Project"

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    thumbnail: str
    category: str
    created_at: str

class Service(BaseModel):
    icon: str
    title: str
    description: str

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="site_settings")
    logo: str = ""
    hero_title: str = "Rexora Media"
    hero_tagline: str = "Visuals built to perform"
    about_title: str = "About Us"
    about_text_1: str = ""
    about_text_2: str = ""
    services: List[Service] = []
    stats: List[dict] = []
    instagram_url: str = "https://instagram.com/rexoramedia"
    contact_email: str = "rexoramedia@gmail.com"

class SiteSettingsUpdate(BaseModel):
    logo: Optional[str] = None
    hero_title: Optional[str] = None
    hero_tagline: Optional[str] = None
    about_title: Optional[str] = None
    about_text_1: Optional[str] = None
    about_text_2: Optional[str] = None
    services: Optional[List[Service]] = None
    stats: Optional[List[dict]] = None
    instagram_url: Optional[str] = None
    contact_email: Optional[str] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    review_text: str
    star_rating: int = Field(ge=1, le=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    client_name: str
    review_text: str
    star_rating: int = Field(ge=1, le=5)

class ReviewUpdate(BaseModel):
    client_name: Optional[str] = None
    review_text: Optional[str] = None
    star_rating: Optional[int] = Field(None, ge=1, le=5)

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_name: str
    review_text: str
    star_rating: int
    created_at: str

# -------------------- AUTH --------------------
def create_token(email: str) -> str:
    payload = {
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    email = login.email.strip()
    password = login.password.strip()

    if email.lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(email)
    return {"token": token, "message": "Login successful"}

@api_router.get("/admin/verify")
async def verify_admin(payload: dict = Depends(verify_token)):
    return {"valid": True, "email": payload["email"]}

# -------------------- PROJECTS --------------------
@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("Project"),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(None),
    payload: dict = Depends(verify_token)
):
    video_content = await video.read()
    if len(video_content) / (1024 * 1024) > 10:
        raise HTTPException(status_code=400, detail="Video too large")

    video_base64 = base64.b64encode(video_content).decode()

    thumbnail_base64 = ""
    if thumbnail:
        thumb = await thumbnail.read()
        thumbnail_base64 = f"data:{thumbnail.content_type};base64,{base64.b64encode(thumb).decode()}"

    project = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "video_data": video_base64,
        "thumbnail": thumbnail_base64,
        "category": category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.projects.insert_one(project)

    return ProjectResponse(**project)

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0, "video_data": 0}).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project_video(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"video_data": project["video_data"]}

# -------------------- REVIEWS --------------------
@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, payload: dict = Depends(verify_token)):
    data = {
        "id": str(uuid.uuid4()),
        **review.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(data)
    return data

@api_router.get("/reviews", response_model=List[ReviewResponse])
async def get_reviews():
    return await db.reviews.find({}, {"_id": 0}).to_list(1000)

# -------------------- SITE SETTINGS --------------------
@api_router.get("/site-settings")
async def get_site_settings():
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    return settings or SiteSettings().model_dump()

@api_router.put("/site-settings")
async def update_site_settings(
    settings: SiteSettingsUpdate,
    payload: dict = Depends(verify_token)
):
    data = {k: v for k, v in settings.model_dump().items() if v is not None}
    await db.site_settings.update_one({"id": "site_settings"}, {"$set": data}, upsert=True)
    return {"message": "Site settings updated"}

# -------------------- HEALTH --------------------
@app.get("/")
async def root():
    return {"message": "Rexora Media API running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown():
    client.close()
