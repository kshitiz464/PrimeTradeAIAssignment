from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    summary="Register a new user",
    description="Creates a new user account. Password is hashed with bcrypt before storage. Returns user profile — never returns the password."
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    new_user = create_user(db, user_data)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Login and get access token",
    description="Authenticates user credentials and returns a JWT access token. Token expires in 30 minutes. Use this token in the Authorization header as: Bearer <token>"
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user based on the JWT token."
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user