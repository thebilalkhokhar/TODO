from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.models.user import User
from app.repositories import todo_repo
from app.schemas.todo import TodoCreate, TodoUpdate


def _get_owned_todo(db: Session, todo_id: int, user_id: int) -> Todo | None:
    todo = todo_repo.get_todo_by_id(db, todo_id)
    if todo is None or todo.user_id != user_id:
        return None
    return todo


def create_todo(db: Session, todo_create: TodoCreate, current_user: User) -> Todo:
    return todo_repo.create_todo(db, current_user.id, todo_create)


def list_todos_for_user(db: Session, current_user: User) -> list[Todo]:
    return todo_repo.get_todos_by_user(db, current_user.id)


def get_todo(db: Session, todo_id: int, current_user: User) -> Todo | None:
    return _get_owned_todo(db, todo_id, current_user.id)


def update_todo(db: Session, todo_id: int, todo_update: TodoUpdate, current_user: User) -> Todo | None:
    todo = _get_owned_todo(db, todo_id, current_user.id)
    if todo is None:
        return None
    return todo_repo.update_todo(db, todo, todo_update)


def delete_todo(db: Session, todo_id: int, current_user: User) -> bool:
    todo = _get_owned_todo(db, todo_id, current_user.id)
    if todo is None:
        return False
    todo_repo.delete_todo(db, todo)
    return True
