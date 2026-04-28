from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate


def create_todo(db: Session, user_id: int, todo_create: TodoCreate) -> Todo:
    todo = Todo(
        title=todo_create.title,
        is_completed=False,
        user_id=user_id,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def get_todos_by_user(db: Session, user_id: int) -> list[Todo]:
    stmt = select(Todo).where(Todo.user_id == user_id).order_by(Todo.id)
    return list(db.scalars(stmt).all())


def get_todo_by_id(db: Session, todo_id: int) -> Todo | None:
    return db.get(Todo, todo_id)


def update_todo(db: Session, todo: Todo, todo_update: TodoUpdate) -> Todo:
    data = todo_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, todo: Todo) -> None:
    db.delete(todo)
    db.commit()
