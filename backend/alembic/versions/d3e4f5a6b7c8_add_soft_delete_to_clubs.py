"""add soft delete to clubs

Revision ID: d3e4f5a6b7c8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'clubs',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'clubs',
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_clubs_deleted_at', 'clubs', ['deleted_at'])
    op.create_foreign_key(
        'fk_clubs_deleted_by_users',
        'clubs',
        'users',
        ['deleted_by'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_clubs_deleted_by_users', 'clubs', type_='foreignkey')
    op.drop_index('ix_clubs_deleted_at', table_name='clubs')
    op.drop_column('clubs', 'deleted_by')
    op.drop_column('clubs', 'deleted_at')
