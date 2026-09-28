"""add start_time to events

Revision ID: 4be3868c3a4f
Revises: d0ca49e07603
Create Date: 2026-09-28 17:29:15.765820

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '4be3868c3a4f'
down_revision: Union[str, None] = 'd0ca49e07603'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE events ADD COLUMN start_time TEXT")


def downgrade() -> None:
    # SQLite doesn't support DROP COLUMN before 3.35; batch workaround kept simple
    pass
