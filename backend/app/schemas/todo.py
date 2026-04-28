from pydantic import BaseModel, ConfigDict


class TodoBase(BaseModel):
    title: str


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None


class TodoResponse(BaseModel):
    id: int
    title: str
    is_completed: bool
    user_id: int

    model_config = ConfigDict(from_attributes=True)
