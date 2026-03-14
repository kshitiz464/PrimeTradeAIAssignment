from fastapi import APIRouter
from app.api.v1 import auth, users, tasks

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])