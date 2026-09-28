import os
import random
import string
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET = os.getenv("JWT_SECRET", "raaspass-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def gen_id(prefix: str = "", length: int = 6) -> str:
    return prefix + "".join(random.choices(CHARS, k=length))


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def create_token(data: dict) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)}
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])


def _get_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_organizer(user=Depends(_get_user)):
    if user.get("role") != "organizer":
        raise HTTPException(status_code=403, detail="Organizer access required")
    return user


def require_customer(user=Depends(_get_user)):
    if user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    return user
