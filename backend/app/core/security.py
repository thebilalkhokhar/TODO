from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# Bcrypt only considers the first 72 bytes of UTF-8 input.
def _password_for_bcrypt(plain_password: str) -> bytes:
    return plain_password.encode("utf-8")[:72]


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(
        _password_for_bcrypt(plain_password),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        _password_for_bcrypt(plain_password),
        hashed_password.encode("utf-8"),
    )


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY must be set in the environment")
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_subject_from_access_token(token: str) -> str | None:
    if not settings.SECRET_KEY:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if isinstance(sub, str):
            return sub
        return None
    except JWTError:
        return None
