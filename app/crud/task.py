from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from typing import Optional


def get_tasks(db: Session, owner_id: Optional[str] = None) -> list[Task]:
    query = db.query(Task)
    if owner_id:
        query = query.filter(Task.owner_id == owner_id)
    return query.order_by(Task.created_at.desc()).all()


def get_task_by_id(db: Session, task_id: str) -> Task | None:
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task_data: TaskCreate, owner_id: str) -> Task:
    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        owner_id=owner_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, db_task: Task, task_update: TaskUpdate) -> Task:
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, db_task: Task) -> None:
    db.delete(db_task)
    db.commit()