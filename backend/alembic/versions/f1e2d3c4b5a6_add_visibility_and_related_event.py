"""add_visibility_and_related_event

Revision ID: f1e2d3c4b5a6
Revises: 86fa88a3d668
Create Date: 2026-03-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1e2d3c4b5a6'
down_revision: Union[str, None] = '86fa88a3d668'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE visibility_type_enum AS ENUM ('friends_only', 'club');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.add_column('events', sa.Column('visibility_type', sa.Enum('friends_only', 'club', name='visibility_type_enum', create_type=False), nullable=True))
    op.add_column('events', sa.Column('visibility_club_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('events', sa.Column('related_event_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_events_visibility_club_id', 'events', 'clubs', ['visibility_club_id'], ['id'])
    op.create_foreign_key('fk_events_related_event_id', 'events', 'events', ['related_event_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_events_related_event_id', 'events', type_='foreignkey')
    op.drop_constraint('fk_events_visibility_club_id', 'events', type_='foreignkey')
    op.drop_column('events', 'related_event_id')
    op.drop_column('events', 'visibility_club_id')
    op.drop_column('events', 'visibility_type')
    op.execute("DROP TYPE visibility_type_enum")
