from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.crud.user import get_all_users
from app.schemas.user import UserResponse
from app.models.user import User

router = APIRouter()


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="List all users (Admin only)",
    description="Returns a list of all registered users. Requires admin role. Regular users will receive 403 Forbidden."
)
def list_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_all_users(db)