from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'adityakittad23@gmail.com').strip()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Sneha@1054').strip()
JWT_SECRET = os.environ.get('JWT_SECRET', 'rexora_media_secret_key_2025')
JWT_ALGORITHM = "HS256"

# Generate a consistent password hash for comparison
# Using a fixed salt to ensure the hash remains the same across server restarts
ADMIN_PASSWORD_HASH = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt())

logger.info(f"Admin email configured: {ADMIN_EMAIL}")
logger.info(f"JWT secret configured: {'*' * len(JWT_SECRET)}")

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
    contact_email: str = "rexoramedia10@gmail.com"

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
    star_rating: int = Field(ge=1, le=5)  # Rating between 1 and 5
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

def create_token(email: str) -> str:
    payload = {
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/admin/login")
async def admin_login(login_data: AdminLogin):
    # Trim whitespace from inputs
    email = login_data.email.strip()
    password = login_data.password.strip()
    
    logger.info(f"Login attempt for email: {email}")
    
    # Check email first
    if email != ADMIN_EMAIL:
        logger.warning(f"Invalid email attempt: {email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password - compare directly for simplicity and reliability
    if password != ADMIN_PASSWORD:
        logger.warning(f"Invalid password attempt for email: {email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    logger.info(f"Successful login for: {email}")
    token = create_token(email)
    return {"token": token, "message": "Login successful"}

@api_router.get("/admin/verify")
async def verify_admin(payload: dict = Depends(verify_token)):
    return {"valid": True, "email": payload['email']}

@api_router.get("/admin/stats")
async def get_admin_stats(payload: dict = Depends(verify_token)):
    """Get dashboard statistics"""
    try:
        # Count total projects
        total_projects = await db.projects.count_documents({})
        
        # Get site settings to count active services
        settings = await db.site_settings.find_one({"id": "site_settings"})
        active_services = len(settings.get("services", [])) if settings else 0
        
        # Get recent projects (last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_projects = await db.projects.count_documents({
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        return {
            "total_projects": total_projects,
            "active_services": active_services,
            "recent_projects": recent_projects
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        return {
            "total_projects": 0,
            "active_services": 0,
            "recent_projects": 0
        }

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("Project"),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(None),
    payload: dict = Depends(verify_token)
):
    try:
        # Read video content
        video_content = await video.read()
        video_size_mb = len(video_content) / (1024 * 1024)
        
        logger.info(f"Received video upload: {video.filename}, size: {video_size_mb:.2f}MB")
        
        # Validate file size (10MB limit to account for base64 encoding + MongoDB 16MB limit)
        MAX_VIDEO_SIZE_MB = 10
        if video_size_mb > MAX_VIDEO_SIZE_MB:
            logger.warning(f"Video size {video_size_mb:.2f}MB exceeds limit of {MAX_VIDEO_SIZE_MB}MB")
            raise HTTPException(
                status_code=400, 
                detail=f"Video file is too large ({video_size_mb:.2f}MB). Maximum allowed size is {MAX_VIDEO_SIZE_MB}MB. Please compress your video and try again."
            )
        
        # Validate video content type
        if not video.content_type or not video.content_type.startswith('video/'):
            logger.warning(f"Invalid content type: {video.content_type}")
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")
        
        # Convert to base64
        video_base64 = base64.b64encode(video_content).decode('utf-8')
        base64_size_mb = len(video_base64) / (1024 * 1024)
        
        logger.info(f"Base64 encoded size: {base64_size_mb:.2f}MB")
        
        # Check if base64 size exceeds MongoDB document limit
        if base64_size_mb > 15:
            logger.error(f"Base64 size {base64_size_mb:.2f}MB exceeds MongoDB limit")
            raise HTTPException(
                status_code=400,
                detail=f"Video file is too large after encoding ({base64_size_mb:.2f}MB). Please use a smaller video file."
            )
        
        # Process thumbnail if provided
        thumbnail_base64 = ""
        if thumbnail:
            thumbnail_content = await thumbnail.read()
            thumbnail_size_mb = len(thumbnail_content) / (1024 * 1024)
            
            logger.info(f"Received thumbnail upload: {thumbnail.filename}, size: {thumbnail_size_mb:.2f}MB")
            
            # Validate thumbnail size (5MB limit)
            MAX_THUMBNAIL_SIZE_MB = 5
            if thumbnail_size_mb > MAX_THUMBNAIL_SIZE_MB:
                logger.warning(f"Thumbnail size {thumbnail_size_mb:.2f}MB exceeds limit of {MAX_THUMBNAIL_SIZE_MB}MB")
                raise HTTPException(
                    status_code=400,
                    detail=f"Thumbnail file is too large ({thumbnail_size_mb:.2f}MB). Maximum allowed size is {MAX_THUMBNAIL_SIZE_MB}MB."
                )
            
            # Validate thumbnail content type
            if not thumbnail.content_type or not thumbnail.content_type.startswith('image/'):
                logger.warning(f"Invalid thumbnail content type: {thumbnail.content_type}")
                raise HTTPException(status_code=400, detail="Invalid thumbnail file type. Please upload an image file.")
            
            # Convert thumbnail to base64 with content type prefix for proper display
            thumbnail_base64 = f"data:{thumbnail.content_type};base64,{base64.b64encode(thumbnail_content).decode('utf-8')}"
            logger.info(f"Thumbnail processed successfully")
        
        project_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "video_data": video_base64,
            "thumbnail": thumbnail_base64,
            "category": category,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into MongoDB with error handling
        result = await db.projects.insert_one(project_data)
        logger.info(f"Successfully inserted project with ID: {project_data['id']}")
        
        return ProjectResponse(
            id=project_data["id"],
            title=project_data["title"],
            description=project_data["description"],
            thumbnail=project_data["thumbnail"],
            category=project_data["category"],
            created_at=project_data["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading project: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload project: {str(e)}"
        )

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0, "video_data": 0}).to_list(1000)
    return [ProjectResponse(**project) for project in projects]

@api_router.get("/projects/{project_id}")
async def get_project_video(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"video_data": project.get("video_data", "")}

@api_router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    project_data: ProjectCreate,
    payload: dict = Depends(verify_token)
):
    update_data = {
        "title": project_data.title,
        "description": project_data.description,
        "category": project_data.category
    }
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project updated successfully"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, payload: dict = Depends(verify_token)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# Site Settings Endpoints
@api_router.get("/site-settings")
async def get_site_settings():
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = {
            "id": "site_settings",
            "logo": "",
            "hero_title": "Rexora Media",
            "hero_tagline": "Visuals built to perform",
            "about_title": "About Us",
            "about_text_1": "Rexora Media is a creative visual studio specializing in high-end video production, photo editing, and brand storytelling.",
            "about_text_2": "We craft visuals that don't just look good—they perform. Every frame is engineered to captivate, convert, and leave a lasting impression.",
            "services": [
                {
                    "icon": "Video",
                    "title": "Video Editing",
                    "description": "Cinematic storytelling that captures attention and drives results"
                },
                {
                    "icon": "Image",
                    "title": "Photo Editing",
                    "description": "Professional retouching and enhancement for stunning visuals"
                },
                {
                    "icon": "Zap",
                    "title": "Reels & Short-Form Content",
                    "description": "Viral-ready content optimized for social media platforms"
                },
                {
                    "icon": "Play",
                    "title": "Brand Visuals",
                    "description": "Cohesive visual identity that elevates your brand presence"
                },
                {
                    "icon": "Sparkles",
                    "title": "Animation",
                    "description": "Dynamic animated content that brings your vision to life"
                },
                {
                    "icon": "Film",
                    "title": "Motion Graphics",
                    "description": "Eye-catching motion design for modern digital experiences"
                },
                {
                    "icon": "Wand2",
                    "title": "VFX (Visual Effects)",
                    "description": "Professional visual effects that transform ordinary footage into extraordinary content"
                }
            ],
            "stats": [
                {"label": "Projects Delivered", "value": "500+", "icon": "🎬"},
                {"label": "Happy Clients", "value": "200+", "icon": "⭐"},
                {"label": "Years of Excellence", "value": "5+", "icon": "🏆"}
            ],
            "instagram_url": "https://instagram.com/rexoramedia",
            "contact_email": "rexoramedia10@gmail.com"
        }
        return default_settings
    return settings

@api_router.put("/site-settings")
async def update_site_settings(
    settings: SiteSettingsUpdate,
    payload: dict = Depends(verify_token)
):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Site settings updated successfully"}

@api_router.post("/site-settings/logo")
async def upload_logo(
    logo: UploadFile = File(...),
    payload: dict = Depends(verify_token)
):
    try:
        # Read logo content
        logo_content = await logo.read()
        logo_size_mb = len(logo_content) / (1024 * 1024)
        
        logger.info(f"Received logo upload: {logo.filename}, size: {logo_size_mb:.2f}MB")
        
        # Validate size (2MB limit)
        MAX_LOGO_SIZE_MB = 2
        if logo_size_mb > MAX_LOGO_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"Logo file is too large ({logo_size_mb:.2f}MB). Maximum allowed size is {MAX_LOGO_SIZE_MB}MB."
            )
        
        # Validate content type
        if not logo.content_type or not logo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")
        
        # Convert to base64 with content type prefix
        logo_base64 = f"data:{logo.content_type};base64,{base64.b64encode(logo_content).decode('utf-8')}"
        
        # Update in database
        result = await db.site_settings.update_one(
            {"id": "site_settings"},
            {"$set": {"logo": logo_base64}},
            upsert=True
        )
        
        logger.info("Logo uploaded successfully")
        return {"message": "Logo uploaded successfully", "logo": logo_base64}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading logo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Rexora Media API is running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()