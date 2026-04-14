"""add supervisor_id to user_club

Revision ID: b2c3d4e5f6a7
Revises: f1e2d3c4b5a6
Create Date: 2026-03-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'f1e2d3c4b5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_club', sa.Column('supervisor_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_user_club_supervisor', 'user_club', 'users', ['supervisor_id'], ['id'])

    # Migrate: set user_club.role='admin' for users who have User.role='admin'
    op.execute("""
        UPDATE user_club
        SET role = 'admin'
        FROM users
        WHERE user_club.user_id = users.id
          AND users.role = 'admin'
          AND user_club.role = 'member'
    """)

    # Reset User.role to 'member' for all non-superadmin admins
    op.execute("""
        UPDATE users SET role = 'member' WHERE role = 'admin'
    """)


def downgrade() -> None:
    # Restore User.role='admin' for users who have user_club.role='admin'
    op.execute("""
        UPDATE users
        SET role = 'admin'
        FROM user_club
        WHERE users.id = user_club.user_id
          AND user_club.role = 'admin'
    """)

    op.drop_constraint('fk_user_club_supervisor', 'user_club', type_='foreignkey')
    op.drop_column('user_club', 'supervisor_id')
