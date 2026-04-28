from sqlalchemy.orm import Session

from app.core import security
from app.repositories import user_repo
from app.schemas.user import Token, UserCreate
from app.models.user import User


def register_user(db: Session, user_create: UserCreate) -> User:
    if user_repo.get_user_by_email(db, user_create.email) is not None:
        raise ValueError("Email already registered")
    hashed = security.hash_password(user_create.password)
    return user_repo.create_user(db, user_create, hashed)


def authenticate_user(db: Session, email: str, password: str) -> Token | None:
    user = user_repo.get_user_by_email(db, email)
    if user is None or not security.verify_password(password, user.hashed_password):
        return None
    access_token = security.create_access_token(subject=user.email)
    return Token(access_token=access_token, token_type="bearer")
