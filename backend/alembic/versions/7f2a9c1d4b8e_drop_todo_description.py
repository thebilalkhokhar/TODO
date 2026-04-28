"""drop description column from todos

Revision ID: 7f2a9c1d4b8e
Revises:
Create Date: 2026-04-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "7f2a9c1d4b8e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE todos DROP COLUMN IF EXISTS description"))


def downgrade() -> None:
    op.add_column(
        "todos",
        sa.Column("description", sa.Text(), nullable=True),
    )
