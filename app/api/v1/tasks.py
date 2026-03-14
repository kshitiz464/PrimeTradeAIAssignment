from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.crud.task import get_tasks, get_task_by_id, create_task, update_task, delete_task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.models.user import User, UserRole

router = APIRouter()


def check_task_access(task, current_user: User):
    if task.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task"
        )


@router.get(
    "/",
    response_model=list[TaskResponse],
    summary="List tasks",
    description="Returns tasks for the current user. Admins see all tasks from all users. Regular users see only their own tasks."
)
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.admin:
        return get_tasks(db)
    return get_tasks(db, owner_id=current_user.id)


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=201,
    summary="Create a new task",
    description="Creates a task owned by the currently authenticated user. Status defaults to 'pending' if not provided."
)
def create_new_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_task(db, task_data, owner_id=current_user.id)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a single task",
    description="Returns a task by ID. Users can only access their own tasks. Admins can access any task. Returns 404 if not found, 403 if unauthorized."
)
def get_single_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_task_access(task, current_user)
    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
    description="Updates a task by ID. Only the task owner or an admin can update it. Only send the fields you want to change — unset fields are left unchanged."
)
def update_existing_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_task_access(task, current_user)
    return update_task(db, task, task_data)


@router.delete(
    "/{task_id}",
    status_code=204,
    summary="Delete a task",
    description="Deletes a task by ID. Only the task owner or an admin can delete it. Returns 204 No Content on success."
)
def delete_existing_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_task_access(task, current_user)
    delete_task(db, task)
    return Response(status_code=204)