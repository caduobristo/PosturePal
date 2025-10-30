from __future__ import annotations

from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError

import schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


async def init_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index("email", unique=True)
    await db.sessions.create_index("user_id")
    await db.sessions.create_index("created_at")


# User operations -------------------------------------------------------------

async def create_user(
    db: AsyncIOMotorDatabase, payload: schemas.UserCreate
) -> schemas.UserPublic:
    now = datetime.utcnow()
    user_in_db = schemas.UserInDB(
        **payload.dict(exclude={"password"}),
        password_hash=hash_password(payload.password),
        created_at=now,
        updated_at=now,
    )

    try:
        await db.users.insert_one(user_in_db.dict())
    except DuplicateKeyError:
        raise ValueError("User with this email already exists")

    return schemas.UserPublic(**user_in_db.dict())


async def get_user_by_email(
    db: AsyncIOMotorDatabase, email: str
) -> Optional[schemas.UserInDB]:
    document = await db.users.find_one({"email": email})
    if not document:
        return None
    return schemas.UserInDB(**document)


async def get_user_by_id(
    db: AsyncIOMotorDatabase, user_id: str
) -> Optional[schemas.UserInDB]:
    document = await db.users.find_one({"id": user_id})
    if not document:
        return None
    return schemas.UserInDB(**document)


# Session operations ----------------------------------------------------------

async def create_session(
    db: AsyncIOMotorDatabase, payload: schemas.SessionCreate
) -> schemas.SessionPublic:
    now = datetime.utcnow()
    session_doc = schemas.SessionInDB(
        **payload.dict(),
        created_at=now,
        updated_at=now,
    )
    await db.sessions.insert_one(session_doc.dict())
    return schemas.SessionPublic(**session_doc.dict())


async def list_sessions_for_user(
    db: AsyncIOMotorDatabase, user_id: str
) -> list[schemas.SessionPublic]:
    cursor = db.sessions.find({"user_id": user_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(schemas.SessionPublic(**doc))
    return results


async def get_session(
    db: AsyncIOMotorDatabase, session_id: str
) -> Optional[schemas.SessionPublic]:
    document = await db.sessions.find_one({"id": session_id})
    if not document:
        return None
    return schemas.SessionPublic(**document)
