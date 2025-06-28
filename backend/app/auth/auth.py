from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_minutes: int = 60) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(request: Request) -> bool:
    """Check if access_token cookie is valid."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing access token.")
    try:
        # Will raise JWTError if invalid
        jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return True
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")