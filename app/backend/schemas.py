from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field, constr, conlist


def generate_id() -> str:
    """Generate a string UUID to use as document identifier."""
    return str(uuid4())


class TimestampedModel(BaseModel):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


# User models ----------------------------------------------------------------

class UserBase(BaseModel):
    name: constr(min_length=1, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: constr(min_length=6, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=100)] = None
    password: Optional[constr(min_length=6, max_length=128)] = None


class UserPublic(TimestampedModel, UserBase):
    pass


class UserInDB(UserPublic):
    password_hash: str


# Session models --------------------------------------------------------------

class Landmark(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0


class SessionFeedback(BaseModel):
    type: constr(min_length=1, max_length=32)
    message: constr(min_length=1, max_length=500)
    score: Optional[float] = None


class SessionMetrics(BaseModel):
    shoulder_alignment: float = Field(ge=0, le=1)
    hip_alignment: float = Field(ge=0, le=1)
    spine_alignment: float = Field(ge=0, le=1)
    knee_angle: float = Field(ge=0, le=1)
    left_arm_extension: float = Field(ge=0, le=1)
    right_arm_extension: float = Field(ge=0, le=1)
    left_arm_height: float = Field(ge=0, le=1)
    right_arm_height: float = Field(ge=0, le=1)


class SessionCreate(BaseModel):
    user_id: str
    exercise_id: str
    exercise_name: constr(min_length=1, max_length=120)
    score: float = Field(ge=0, le=100)
    feedback: List[SessionFeedback] = Field(default_factory=list)
    metrics: SessionMetrics
    landmark_frames: List[conlist(Landmark, min_length=1)] = Field(default_factory=list)


class SessionPublic(TimestampedModel, SessionCreate):
    pass


class SessionInDB(SessionPublic):
    pass
