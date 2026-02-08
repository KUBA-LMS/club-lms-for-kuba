"""
Database seed script for development/testing.
Creates admin user, test users, clubs, and mock events.
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration


# Fixed UUIDs for consistent seeding
ADMIN_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
KUBA_CLUB_ID = uuid.UUID("00000000-0000-0000-0000-000000000101")
KUBA_GROUP_8_CLUB_ID = uuid.UUID("00000000-0000-0000-0000-000000000102")

# Event UUIDs matching frontend MOCK_EVENTS
EVENT_1_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
EVENT_2_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
EVENT_3_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
EVENT_4_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
EVENT_5_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")

# Registration UUIDs for test user
REG_1_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-111111111111")
REG_3_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-333333333333")


async def seed_database():
    """Seed the database with initial data."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(User).where(User.id == ADMIN_USER_ID))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # Create Admin User
        admin_user = User(
            id=ADMIN_USER_ID,
            username="admin",
            email="admin@kuba.kr",
            hashed_password=get_password_hash("admin123!"),
            legal_name="Admin User",
            student_id="2023000000",
            role="admin",
            is_active=True,
        )
        session.add(admin_user)
        print("Created admin user (username: admin, password: admin123!)")

        # Create Test User
        test_user = User(
            id=TEST_USER_ID,
            username="testuser",
            email="test@kuba.kr",
            hashed_password=get_password_hash("test1234!"),
            legal_name="Test User",
            student_id="2023000001",
            role="member",
            is_active=True,
        )
        session.add(test_user)
        print("Created test user (username: testuser, password: test1234!)")

        # Create Clubs
        kuba_club = Club(
            id=KUBA_CLUB_ID,
            name="45th_KUBA",
            description="Korea University Business Administration student club",
            university="Korea University",
        )
        session.add(kuba_club)

        kuba_group_8 = Club(
            id=KUBA_GROUP_8_CLUB_ID,
            name="45th_KUBA_Group_8",
            description="KUBA Group 8 subgroup",
            university="Korea University",
        )
        session.add(kuba_group_8)
        print("Created clubs: 45th_KUBA, 45th_KUBA_Group_8")

        await session.flush()

        # Create Events (matching frontend MOCK_EVENTS)
        now = datetime.utcnow()

        # Event 1: KUBA 45th Orientation - registered status
        event_1 = Event(
            id=EVENT_1_ID,
            title="KUBA 45th Orientation",
            description="Welcome to KUBA! This is the orientation event for new members.",
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=10),
            registration_end=now - timedelta(days=3),
            event_date=datetime(2025, 8, 28, 18, 0, 0),
            event_location="Korea University, Anam Campus, Business Building",
            max_slots=100,
            current_slots=50,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_1)

        # Event 2: After Party - open status
        event_2 = Event(
            id=EVENT_2_ID,
            title="KUBA 45th Orientation After Party",
            description="After party for the orientation event. Food and drinks provided!",
            event_type="private",
            cost_type="free",
            registration_start=now - timedelta(days=5),
            registration_end=now + timedelta(days=5),
            event_date=datetime(2025, 8, 28, 21, 0, 0),
            event_location="Anam Station Area, TBD",
            max_slots=50,
            current_slots=20,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_GROUP_8_CLUB_ID,
        )
        session.add(event_2)

        # Event 3: Cheering Orientation - requested status
        event_3 = Event(
            id=EVENT_3_ID,
            title="KUBA 45th Cheering Orientation",
            description="Learn the cheering songs and chants for Korea University!",
            event_type="official",
            cost_type="free",
            registration_start=now - timedelta(days=3),
            registration_end=now + timedelta(days=2),
            event_date=datetime(2025, 8, 31, 17, 0, 0),
            event_location="Korea University Stadium",
            max_slots=200,
            current_slots=150,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_3)

        # Event 4: Club Party - closed status
        event_4 = Event(
            id=EVENT_4_ID,
            title="KUBA Club Party",
            description="End of semester celebration party!",
            event_type="official",
            cost_type="prepaid",
            cost_amount=Decimal("30000"),
            registration_start=now - timedelta(days=30),
            registration_end=now - timedelta(days=10),
            event_date=datetime(2025, 11, 20, 19, 0, 0),
            event_location="Hongdae Area, TBD",
            max_slots=80,
            current_slots=80,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_4)

        # Event 5: Group lunch - upcoming status
        event_5 = Event(
            id=EVENT_5_ID,
            title="KUBA Group 8 lunch gathering",
            description="Casual lunch gathering for Group 8 members",
            event_type="private",
            cost_type="one_n",
            registration_start=datetime(2026, 11, 1, 12, 0, 0),
            registration_end=datetime(2026, 11, 25, 12, 0, 0),
            event_date=datetime(2026, 11, 28, 12, 0, 0),
            event_location="Near Anam Station",
            max_slots=15,
            current_slots=0,
            provided_by_id=ADMIN_USER_ID,
            posted_by_id=ADMIN_USER_ID,
            club_id=KUBA_CLUB_ID,
        )
        session.add(event_5)
        print("Created 5 mock events")

        await session.flush()

        # Create Registrations for test user
        # Registration 1: Confirmed for Event 1 (registered status)
        reg_1 = Registration(
            id=REG_1_ID,
            user_id=TEST_USER_ID,
            event_id=EVENT_1_ID,
            status="confirmed",
            payment_status="completed",
        )
        session.add(reg_1)

        # Registration 3: Pending for Event 3 (requested status)
        reg_3 = Registration(
            id=REG_3_ID,
            user_id=TEST_USER_ID,
            event_id=EVENT_3_ID,
            status="pending",
            payment_status="pending",
        )
        session.add(reg_3)
        print("Created registrations for test user")

        await session.commit()
        print("Database seeding completed successfully!")


async def clear_database():
    """Clear all data from the database (use with caution!)."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Delete in reverse order of dependencies
        await session.execute("DELETE FROM registrations")
        await session.execute("DELETE FROM events")
        await session.execute("DELETE FROM user_club")
        await session.execute("DELETE FROM friendships")
        await session.execute("DELETE FROM clubs")
        await session.execute("DELETE FROM users")
        await session.commit()
        print("Database cleared!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        asyncio.run(clear_database())
    else:
        asyncio.run(seed_database())
