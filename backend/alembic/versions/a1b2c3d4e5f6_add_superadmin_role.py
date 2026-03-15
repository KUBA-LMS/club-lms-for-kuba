"""add_superadmin_role

Revision ID: a1b2c3d4e5f6
Revises: 8790ca1dc4b8
Create Date: 2026-02-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8790ca1dc4b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'superadmin' to role_enum."""
    op.execute("ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'superadmin'")


def downgrade() -> None:
    """Cannot remove enum values in PostgreSQL. Manual intervention required."""
    pass
