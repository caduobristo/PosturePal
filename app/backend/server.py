from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

import schemas
import db as db_helpers


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


async def get_database():
    return db


@app.on_event("startup")
async def startup_event():
    await db_helpers.init_indexes(db)


# Legacy status routes -------------------------------------------------------

@api_router.get("/")
async def root():
    return {"message": "Hello World"}


# User routes ----------------------------------------------------------------

@api_router.post(
    "/users",
    response_model=schemas.UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    payload: schemas.UserCreate,
    database=Depends(get_database),
):
    try:
        user = await db_helpers.create_user(database, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return user


@api_router.post("/auth/login", response_model=schemas.UserPublic)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    database=Depends(get_database),
):
    user = await db_helpers.get_user_by_email(database, form_data.username)
    if not user or not db_helpers.verify_password(
        form_data.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return schemas.UserPublic(**user.dict())


@api_router.get("/users/{user_id}", response_model=schemas.UserPublic)
async def get_user(user_id: str, database=Depends(get_database)):
    user = await db_helpers.get_user_by_id(database, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return schemas.UserPublic(**user.dict())


# Session routes -------------------------------------------------------------

@api_router.post(
    "/sessions",
    response_model=schemas.SessionPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    payload: schemas.SessionCreate,
    database=Depends(get_database),
):
    # Ensure user exists
    user = await db_helpers.get_user_by_id(database, payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id",
        )
    session = await db_helpers.create_session(database, payload)
    return session


@api_router.get(
    "/sessions/{session_id}",
    response_model=schemas.SessionPublic,
)
async def get_session(session_id: str, database=Depends(get_database)):
    session = await db_helpers.get_session(database, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    return session


@api_router.get(
    "/users/{user_id}/sessions",
    response_model=List[schemas.SessionPublic],
)
async def list_sessions_for_user(user_id: str, database=Depends(get_database)):
    sessions = await db_helpers.list_sessions_for_user(database, user_id)
    return sessions

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
